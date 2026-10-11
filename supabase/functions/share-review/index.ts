import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
    const cloudflareToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
    if (!url || !serviceKey || !accountId || !cloudflareToken) {
      return reply({ error: 'Client review is not configured.' }, 503)
    }

    const body = await request.json()
    const action = body?.action
    const shareToken = typeof body?.shareToken === 'string' ? body.shareToken : ''
    if (!TOKEN_PATTERN.test(shareToken)) return reply({ error: 'This review link is invalid.' }, 404)

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, title, client_name, status, current_version, share_token, created_at, trashed_at, project_versions(id, version_number, status, video_provider, video_asset_id, created_at, approved_at, review_comments(id, timestamp_seconds, body, author_name, status, created_at))')
      .eq('share_token', shareToken)
      .maybeSingle()
    if (projectError) {
      console.error('Could not load shared project:', projectError.message)
      return reply({ error: 'Could not load this review.' }, 500)
    }
    if (!project || project.status === 'trashed') return reply({ error: 'This review link is invalid or expired.' }, 404)

    const currentVersion = (project.project_versions || []).find((version: any) => version.version_number === project.current_version)
    if (!currentVersion) return reply({ error: 'The current review version is not available yet.' }, 409)

    if (action === 'load') {
      let playbackUrl: string | null = null
      let videoPending = false
      if (currentVersion.video_provider === 'cloudflare' && currentVersion.video_asset_id) {
        const tokenResponse = await fetch('https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(accountId) + '/stream/' + encodeURIComponent(currentVersion.video_asset_id) + '/token', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + cloudflareToken },
        })
        if (tokenResponse.ok) {
          const tokenBody = await tokenResponse.json()
          const signedToken = tokenBody?.success && typeof tokenBody?.result?.token === 'string' ? tokenBody.result.token : null
          if (signedToken) playbackUrl = 'https://iframe.videodelivery.net/' + signedToken
          else videoPending = true
        } else {
          videoPending = true
          console.warn('Cloudflare playback token is not available yet:', tokenResponse.status)
        }
      }

      const comments = (currentVersion.review_comments || []).map((comment: any) => ({
        id: comment.id,
        timestamp: Number(comment.timestamp_seconds) || 0,
        text: comment.body,
        author: comment.author_name,
        createdAt: comment.created_at,
        status: comment.status === 'resolved' ? 'resolved' : 'open',
      }))
      return reply({
        project: {
          id: project.id,
          title: project.title,
          client: project.client_name,
          status: project.status,
          version: project.current_version,
          createdAt: project.created_at,
          shareToken: project.share_token,
          comments,
          versionHistory: [],
        },
        playbackUrl,
        videoPending,
      })
    }

    if (action === 'comment') {
      if (project.status === 'completed') return reply({ error: 'This completed review is read-only.' }, 409)
      const text = typeof body.text === 'string' ? body.text.trim() : ''
      const authorName = typeof body.authorName === 'string' ? body.authorName.trim().slice(0, 80) : ''
      const timestamp = Number(body.timestampSeconds)
      if (!text || text.length > 2000 || !authorName || !Number.isFinite(timestamp) || timestamp < 0 || timestamp > 14400) {
        return reply({ error: 'The feedback details are invalid.' }, 400)
      }

      if (project.status === 'approved') {
        const { error: projectUpdateError } = await admin.from('projects').update({ status: 'in_review' }).eq('id', project.id)
        if (projectUpdateError) return reply({ error: 'Could not reopen the review for new feedback.' }, 500)
        const { error: versionUpdateError } = await admin.from('project_versions').update({ status: 'in_review', approved_at: null }).eq('id', currentVersion.id)
        if (versionUpdateError) return reply({ error: 'Could not reopen the current version.' }, 500)
      }

      const { error: insertError } = await admin.from('review_comments').insert({
        version_id: currentVersion.id,
        timestamp_seconds: Math.round(timestamp * 1000) / 1000,
        body: text,
        author_name: authorName,
        status: 'open',
      })
      if (insertError) return reply({ error: 'Could not save your feedback. Please try again.' }, 500)
      return reply({ ok: true })
    }

    if (action === 'approve') {
      if (project.status === 'completed') return reply({ error: 'This project is read-only.' }, 409)
      const { error: versionUpdateError } = await admin.from('project_versions').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', currentVersion.id)
      if (versionUpdateError) return reply({ error: 'Could not approve this version.' }, 500)
      const { error: projectUpdateError } = await admin.from('projects').update({ status: 'approved' }).eq('id', project.id)
      if (projectUpdateError) return reply({ error: 'The version was approved, but the project status could not be updated.' }, 500)
      return reply({ ok: true })
    }

    return reply({ error: 'Unknown review action.' }, 400)
  } catch (error) {
    console.error('share-review failed:', error)
    return reply({ error: 'Could not complete the review action.' }, 500)
  }
})
