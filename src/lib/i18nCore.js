export const LOCALE_OPTIONS = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
]

export const COOKIE_NAMES = Object.freeze({ locale: 'reviewflow_locale', notice: 'reviewflow_cookie_notice' })
const supported = new Set(LOCALE_OPTIONS.map(({ code }) => code))
const rowsText = `
Active projects	Projets actifs	Proyectos activos	Aktive Projekte	Projetos ativos
Active work	Travail en cours	Trabajo activo	Aktuelle Arbeit	Trabalho ativo
Add feedback	Ajouter un commentaire	Añadir comentario	Feedback hinzufügen	Adicionar comentário
Add the project details and your current video. After that, you can review the cut yourself or switch to the client view to test the approval flow.	Ajoutez les détails du projet et votre vidéo. Vous pourrez ensuite examiner le montage ou passer à la vue client pour tester l’approbation.	Añade los detalles del proyecto y tu vídeo. Después podrás revisar el montaje o cambiar a la vista del cliente para probar la aprobación.	Füge die Projektdetails und dein aktuelles Video hinzu. Anschließend kannst du den Schnitt selbst prüfen oder zur Kundenansicht wechseln, um den Freigabeablauf zu testen.	Adicione os detalhes do projeto e o vídeo. Depois, pode rever a edição ou mudar para a vista do cliente para testar a aprovação.
Already have an account? Sign in.	Vous avez déjà un compte ? Connectez-vous.	¿Ya tienes una cuenta? Inicia sesión.	Du hast bereits ein Konto? Melde dich an.	Já tem uma conta? Inicie sessão.
Approve this version	Approuver cette version	Aprobar esta versión	Diese Version freigeben	Aprovar esta versão
Approved by client	Approuvée par le client	Aprobado por el cliente	Vom Kunden freigegeben	Aprovado pelo cliente
Approved versions	Versions approuvées	Versiones aprobadas	Freigegebene Versionen	Versões aprovadas
Approved	Approuvé	Aprobado	Freigegeben	Aprovado
Archive	Archives	Archivo	Archiv	Arquivo
Ask the editor for a new link to the current video version.	Demandez à l’éditeur un nouveau lien vers la version actuelle.	Pide al editor un nuevo enlace a la versión actual del vídeo.	Bitte den Editor um einen neuen Link zur aktuellen Videoversion.	Peça ao editor um novo link para a versão atual do vídeo.
At least 6 characters	Au moins 6 caractères	Al menos 6 caracteres	Mindestens 6 Zeichen	Pelo menos 6 caracteres
Back to projects	Retour aux projets	Volver a proyectos	Zurück zu den Projekten	Voltar aos projetos
Cancel	Annuler	Cancelar	Abbrechen	Cancelar
Change file	Changer de fichier	Cambiar archivo	Datei ändern	Alterar ficheiro
Check your email to confirm your account, then sign in.	Consultez votre e-mail pour confirmer votre compte, puis connectez-vous.	Revisa tu correo para confirmar la cuenta y luego inicia sesión.	Prüfe deine E-Mails, um dein Konto zu bestätigen, und melde dich dann an.	Consulte o email para confirmar a conta e depois inicie sessão.
Checking your account…	Vérification du compte…	Comprobando tu cuenta…	Konto wird überprüft…	A verificar a conta…
Choose a video	Choisir une vidéo	Elegir un vídeo	Video auswählen	Escolher vídeo
Client name	Nom du client	Nombre del cliente	Kundenname	Nome do cliente
Client review	Avis du client	Revisión del cliente	Kundenreview	Revisão do cliente
Client: {client}	Client : {client}	Cliente: {client}	Kunde: {client}	Cliente: {client}
Cloud project data will be connected to this account in the next migration step.	Les données cloud du projet seront associées à ce compte lors de la prochaine étape.	Los datos en la nube se vincularán a esta cuenta en el siguiente paso.	Die Cloud-Projektdaten werden im nächsten Migrationsschritt mit diesem Konto verknüpft.	Os dados dos projetos na nuvem serão ligados a esta conta na próxima etapa.
Cloud setup	Configuration cloud	Configuración en la nube	Cloud-Einrichtung	Configuração da nuvem
Completed projects	Projets terminés	Proyectos completados	Abgeschlossene Projekte	Projetos concluídos
Completed work stays here, separate from projects that still need attention.	Les projets terminés restent ici, séparés de ceux qui nécessitent encore votre attention.	Los proyectos terminados quedan aquí, separados de los que aún necesitan atención.	Abgeschlossene Projekte bleiben hier und sind von Projekten getrennt, die noch Aufmerksamkeit benötigen.	Os projetos concluídos ficam aqui, separados dos que ainda precisam de atenção.
Completed	Terminé	Completado	Abgeschlossen	Concluído
Connect your ReviewFlow account.	Connectez votre compte ReviewFlow.	Conecta tu cuenta de ReviewFlow.	Verbinde dein ReviewFlow-Konto.	Ligue a sua conta ReviewFlow.
Copy review link	Copier le lien de révision	Copiar enlace de revisión	Review-Link kopieren	Copiar link de revisão
Create a project to start your next client review.	Créez un projet pour commencer votre prochaine révision client.	Crea un proyecto para iniciar tu próxima revisión con un cliente.	Erstelle ein Projekt, um dein nächstes Kundenreview zu starten.	Crie um projeto para iniciar a próxima revisão com o cliente.
Create a project, upload a cut, send your client a review link, and keep every comment tied to the video.	Créez un projet, importez un montage, envoyez un lien de révision au client et gardez chaque commentaire associé à la vidéo.	Crea un proyecto, sube un montaje, envía un enlace de revisión al cliente y mantén cada comentario vinculado al vídeo.	Erstelle ein Projekt, lade einen Schnitt hoch, sende deinem Kunden einen Review-Link und halte alle Kommentare direkt am Video fest.	Crie um projeto, carregue uma edição, envie um link de revisão ao cliente e mantenha cada comentário ligado ao vídeo.
Create account	Criar un compte	Crear cuenta	Konto erstellen	Criar conta
Create project	Créer un projet	Crear proyecto	Projekt erstellen	Criar projeto
Create your editor account.	Créez votre compte de monteur.	Crea tu cuenta de editor.	Erstelle dein Editor-Konto.	Crie a sua conta de editor.
Current playback time {current} of {duration}	Position actuelle {current} sur {duration}	Tiempo actual {current} de {duration}	Aktuelle Wiedergabezeit: {current} von {duration}	Tempo atual {current} de {duration}
Delete forever	Supprimer définitivement	Eliminar para siempre	Endgültig löschen	Eliminar para sempre
Delete project	Supprimer le projet	Eliminar proyecto	Projekt löschen	Eliminar projeto
Delete “{title}” forever?	Supprimer définitivement « {title} » ?	¿Eliminar «{title}» para siempre?	„{title}“ endgültig löschen?	Eliminar “{title}” para sempre?
Deleted projects stay here for now.	Les projets supprimés restent ici temporairement.	Los proyectos eliminados permanecen aquí por ahora.	Gelöschte Projekte bleiben vorerst hier.	Os projetos eliminados ficam aqui por enquanto.
Dismiss	Fermer	Cerrar	Schließen	Fechar
Editor review	Révision de l’éditeur	Revisión del editor	Editor-Review	Revisão do editor
Email	E-mail	Correo electrónico	E-Mail	Email
Exit client preview	Quitter l’aperçu client	Salir de la vista del cliente	Kundenvorschau verlassen	Sair da pré-visualização do cliente
Feedback time	Instant du commentaire	Momento del comentario	Feedback-Zeitpunkt	Momento do comentário
Feedback	Commentaires	Comentarios	Feedback	Comentários
Go back 5 seconds	Reculer de 5 secondes	Retroceder 5 segundos	5 Sekunden zurück	Voltar 5 segundos
Go forward 5 seconds	Avancer de 5 secondes	Avanzar 5 segundos	5 Sekunden vor	Avançar 5 segundos
How to review	Comment effectuer la révision	Cómo revisar	So funktioniert das Review	Como rever
In review	En révision	En revisión	In Prüfung	Em revisão
In trash	Dans la corbeille	En la papelera	Im Papierkorb	No lixo
Keep every client review in one place.	Centralisez toutes les révisions client.	Centraliza todas las revisiones de tus clientes.	Alle Kundenreviews an einem Ort.	Mantenha todas as revisões de clientes num só lugar.
Launch video	Vidéo de lancement	Vídeo de lanzamiento	Video starten	Vídeo de lançamento
Local mode is still active.	Le mode local est toujours actif.	El modo local sigue activo.	Der lokale Modus ist weiterhin aktiv.	O modo local continua ativo.
Mark complete	Marquer comme terminé	Marcar como completado	Als abgeschlossen markieren	Marcar como concluído
Mark project complete	Marquer le projet comme terminé	Marcar proyecto como completado	Projekt als abgeschlossen markieren	Marcar projeto como concluído
Move to Trash	Déplacer vers la corbeille	Mover a la papelera	In den Papierkorb verschieben	Mover para o lixo
Move “{title}” to Trash?	Déplacer « {title} » vers la corbeille ?	¿Mover «{title}» a la papelera?	„{title}“ in den Papierkorb verschieben?	Mover “{title}” para o lixo?
Mute video	Couper le son	Silenciar vídeo	Video stummschalten	Silenciar vídeo
Mute	Couper le son	Silenciar	Stummschalten	Silenciar
Muted	Son coupé	Silenciado	Stummgeschaltet	Sem som
Need an account? Create one.	Besoin d’un compte ? Créez-en un.	¿Necesitas una cuenta? Crea una.	Noch kein Konto? Erstelle eins.	Precisa de uma conta? Crie uma.
Needs your review	À vérifier	Necesita tu revisión	Wartet auf deine Prüfung	Precisa da sua revisão
No active projects	Aucun projet actif	No hay proyectos activos	Keine aktiven Projekte	Sem projetos ativos
No feedback yet. Add a note at the current video time.	Aucun commentaire pour le moment. Ajoutez une note à l’instant actuel de la vidéo.	Aún no hay comentarios. Añade una nota en el momento actual del vídeo.	Noch kein Feedback. Füge eine Notiz an der aktuellen Videoposition hinzu.	Ainda não há comentários. Adicione uma nota no momento atual do vídeo.
No video uploaded	Aucune vidéo importée	No se ha subido ningún vídeo	Kein Video hochgeladen	Nenhum vídeo carregado
Northstar Coffee	Northstar Coffee	Northstar Coffee	Northstar Coffee	Northstar Coffee
Open a project to review feedback or preview the client view.	Ouvrez un projet pour examiner les commentaires ou prévisualiser la vue client.	Abre un proyecto para revisar los comentarios o previsualizar la vista del cliente.	Öffne ein Projekt, um Feedback zu prüfen oder die Kundenansicht in der Vorschau zu öffnen.	Abra um projeto para rever comentários ou pré-visualizar a vista do cliente.
Open feedback	Commentaires ouverts	Comentarios abiertos	Offenes Feedback	Comentários em aberto
Open review	Ouvrir la révision	Abrir revisión	Review öffnen	Abrir revisão
Open {title}	Ouvrir {title}	Abrir {title}	{title} öffnen	Abrir {title}
Required. The video stays in this browser.	Obligatoire. La vidéo reste dans ce navigateur.	Obligatorio. El vídeo permanece en este navegador.	Erforderlich. Das Video bleibt in diesem Browser.	Obrigatório. O vídeo permanece neste navegador.
Original state: {status}	État initial : {status}	Estado anterior: {status}	Ursprünglicher Status: {status}	Estado original: {status}
Password	Mot de passe	Contraseña	Passwort	Palavra-passe
Pause video	Mettre en pause	Pausar vídeo	Video pausieren	Pausar vídeo
Pause where you want a change	Mettez en pause là où vous souhaitez un changement	Pausa donde quieras un cambio	Pausiere an der Stelle, an der etwas geändert werden soll.	Pause onde pretende uma alteração
Play the video	Lire la vidéo	Reproducir el vídeo	Video abspielen	Reproduzir o vídeo
Play video	Lire la vidéo	Reproducir vídeo	Video abspielen	Reproduzir vídeo
Please confirm	Veuillez confirmer	Confirma la acción	Bitte bestätigen	Confirme
Preview as client	Aperçu client	Vista previa del cliente	Als Kunde ansehen	Pré-visualizar como cliente
Preview the client view, then copy the review link and send it to your client. This prototype link works only in this browser; cloud sharing comes next.	Prévisualisez la vue client, puis copiez le lien de révision à envoyer au client. Ce lien de prototype ne fonctionne que dans ce navigateur ; le partage cloud viendra ensuite.	Previsualiza la vista del cliente, copia el enlace de revisión y envíaselo. Este enlace de prototipo solo funciona en este navegador; el uso compartido en la nube llegará después.	Sieh dir die Kundenansicht an, kopiere anschließend den Review-Link und sende ihn deinem Kunden. Dieser Prototyp-Link funktioniert nur in diesem Browser; Cloud-Freigaben kommen später.	Pré-visualize a vista do cliente e envie-lhe o link de revisão. Este link de protótipo só funciona neste navegador; a partilha na nuvem virá depois.
Project completed	Projet terminé	Proyecto completado	Projekt abgeschlossen	Projeto concluído
Project name	Nom du projet	Nombre del proyecto	Projektname	Nome do projeto
Project summary	Résumé du projet	Resumen del proyecto	Projektzusammenfassung	Resumo do projeto
Projects to review	Projets à réviser	Proyectos por revisar	Zu prüfende Projekte	Projetos a rever
Projects you delete will appear here until you permanently remove them.	Les projets supprimés apparaissent ici jusqu’à leur suppression définitive.	Los proyectos eliminados aparecerán aquí hasta que los elimines definitivamente.	Gelöschte Projekte erscheinen hier, bis du sie endgültig entfernst.	Os projetos eliminados aparecem aqui até serem removidos definitivamente.
Projects	Projets	Proyectos	Projekte	Projetos
Reopen project	Rouvrir le projet	Reabrir proyecto	Projekt erneut öffnen	Reabrir projeto
Reopen	Rouvrir	Reabrir	Erneut öffnen	Reabrir
Required. This is shown on the project and client review.	Obligatoire. Ce nom apparaît dans le projet et la révision client.	Obligatorio. Se muestra en el proyecto y en la revisión del cliente.	Erforderlich. Dieser Name wird im Projekt und im Kundenreview angezeigt.	Obrigatório. É apresentado no projeto e na revisão do cliente.
Required. Use the name your client will recognize.	Obligatoire. Utilisez le nom que votre client reconnaîtra.	Obligatorio. Usa el nombre que reconocerá tu cliente.	Erforderlich. Verwende einen Namen, den dein Kunde wiedererkennt.	Obrigatório. Use o nome que o cliente reconhecerá.
Resolve feedback	Résoudre le commentaire	Resolver comentario	Feedback erledigen	Resolver comentário
Resolve	Résoudre	Resolver	Erledigen	Resolver
Restore a project when you changed your mind, or permanently delete it when you are certain you no longer need it.	Restaurez un projet si vous avez changé d’avis, ou supprimez-le définitivement si vous n’en avez plus besoin.	Restaura un proyecto si cambias de opinión o elimínalo definitivamente cuando estés seguro.	Stelle ein Projekt wieder her, wenn du es dir anders überlegt hast, oder lösche es endgültig, wenn du sicher bist, dass du es nicht mehr brauchst.	Restaure um projeto se mudou de ideias ou elimine-o definitivamente quando tiver a certeza.
Restore project	Restaurer le projet	Restaurar proyecto	Projekt wiederherstellen	Restaurar projeto
Review link copied	Lien de révision copié	Enlace de revisión copiado	Review-Link kopiert	Link de revisão copiado
Review link	Lien de révision	Enlace de revisión	Review-Link	Link de revisão
Review the video	Réviser la vidéo	Revisar el vídeo	Video überprüfen	Reveja o vídeo
Review workflow	Étapes de révision	Flujo de revisión	Review-Ablauf	Fluxo de revisão
ReviewFlow account	Compte ReviewFlow	Cuenta de ReviewFlow	ReviewFlow-Konto	Conta ReviewFlow
Saving video…	Enregistrement de la vidéo…	Guardando vídeo…	Video wird gespeichert…	A guardar o vídeo…
Selected video	Vidéo sélectionnée	Vídeo seleccionado	Ausgewähltes Video	Vídeo selecionado
Send feedback or approve	Envoyez un commentaire ou approuvez	Envía comentarios o aprueba	Feedback senden oder freigeben	Envie comentários ou aprove
Send feedback	Envoyer le commentaire	Enviar comentario	Feedback senden	Enviar comentário
Send the review link	Envoyer le lien de révision	Enviar el enlace de revisión	Review-Link senden	Enviar o link de revisão
Sign in	Se connecter	Iniciar sesión	Anmelden	Iniciar sessão
Sign out	Se déconnecter	Cerrar sesión	Abmelden	Terminar sessão
Something went wrong in the page. Your saved projects are kept locally; reload if the page becomes unresponsive.	Un problème est survenu. Vos projets restent enregistrés localement ; rechargez la page si elle ne répond plus.	Algo salió mal. Tus proyectos siguen guardados localmente; recarga la página si deja de responder.	Auf der Seite ist ein Fehler aufgetreten. Deine gespeicherten Projekte bleiben lokal erhalten. Lade die Seite neu, wenn sie nicht mehr reagiert.	Ocorreu um erro. Os projetos continuam guardados localmente; recarregue a página se deixar de responder.
Something went wrong while completing that action. Please try again.	Un problème est survenu pendant cette action. Réessayez.	Algo salió mal al completar esa acción. Inténtalo de nuevo.	Beim Ausführen dieser Aktion ist ein Fehler aufgetreten. Bitte versuche es erneut.	Ocorreu um erro ao concluir essa ação. Tente novamente.
Start a client review.	Démarrer une révision client.	Inicia una revisión con un cliente.	Kundenreview starten.	Inicie uma revisão com o cliente.
Start next version	Démarrer la version suivante	Iniciar la siguiente versión	Nächste Version starten	Iniciar próxima versão
Supabase is optional until you configure a project.	Supabase reste facultatif tant que vous n’avez pas configuré de projet.	Supabase es opcional hasta que configures un proyecto.	Supabase ist optional, bis du ein Projekt konfiguriert hast.	O Supabase é opcional até configurar um projeto.
The project will leave your active work, but you can restore it from Trash. Its saved video will stay there until you permanently delete the project.	Le projet quittera votre travail actif, mais vous pourrez le restaurer depuis la corbeille. Sa vidéo restera conservée jusqu’à la suppression définitive.	El proyecto saldrá del trabajo activo, pero podrás restaurarlo desde la papelera. El vídeo se conservará hasta eliminar el proyecto definitivamente.	Das Projekt wird aus deiner aktiven Arbeit entfernt, kann aber aus dem Papierkorb wiederhergestellt werden. Das gespeicherte Video bleibt dort, bis du das Projekt endgültig löschst.	O projeto sairá do trabalho ativo, mas pode restaurá-lo do lixo. O vídeo ficará guardado até eliminar o projeto definitivamente.
The video could not be deleted from browser storage. The project is still in Trash; please try again.	La vidéo n’a pas pu être supprimée du stockage du navigateur. Le projet reste dans la corbeille ; réessayez.	No se pudo eliminar el vídeo del almacenamiento del navegador. El proyecto sigue en la papelera; inténtalo de nuevo.	Das Video konnte nicht aus dem Browser-Speicher gelöscht werden. Das Projekt liegt weiterhin im Papierkorb. Bitte versuche es erneut.	Não foi possível eliminar o vídeo do armazenamento do navegador. O projeto continua no lixo; tente novamente.
The video could not be saved in this browser. Try a smaller file or check available storage.	La vidéo n’a pas pu être enregistrée dans ce navigateur. Essayez un fichier plus petit ou vérifiez l’espace disponible.	No se pudo guardar el vídeo en este navegador. Prueba con un archivo más pequeño o comprueba el almacenamiento disponible.	Das Video konnte in diesem Browser nicht gespeichert werden. Versuche es mit einer kleineren Datei oder prüfe den verfügbaren Speicherplatz.	Não foi possível guardar o vídeo neste navegador. Experimente um ficheiro menor ou verifique o espaço disponível.
The video may be unavailable or the browser may have trouble decoding it. Try loading it again.	La vidéo est peut-être indisponible ou le navigateur n’arrive pas à la décoder. Réessayez de la charger.	Puede que el vídeo no esté disponible o que el navegador no pueda decodificarlo. Intenta cargarlo de nuevo.	Das Video ist möglicherweise nicht verfügbar oder der Browser kann es nicht dekodieren. Versuche, es erneut zu laden.	O vídeo pode estar indisponível ou o navegador pode não conseguir descodificá-lo. Tente carregá-lo novamente.
This build still works locally. To enable accounts and cloud persistence, add your Supabase URL and publishable key to	Cette version fonctionne encore en local. Pour activer les comptes et le stockage cloud, ajoutez l’URL Supabase et la clé publique à	Esta versión sigue funcionando localmente. Para activar cuentas y almacenamiento en la nube, añade la URL y la clave pública de Supabase a	Dieser Build funktioniert weiterhin lokal. Um Konten und Cloud-Speicherung zu aktivieren, füge deine Supabase-URL und deinen Publishable Key hinzu:	Esta versão continua a funcionar localmente. Para ativar contas e armazenamento na nuvem, adicione o URL e a chave pública do Supabase a
This permanently removes the project and its saved local video from this browser. There is no undo after this.	Cela supprime définitivement le projet et sa vidéo locale de ce navigateur. Cette action est irréversible.	Esto elimina definitivamente el proyecto y su vídeo local de este navegador. No se puede deshacer.	Dadurch werden das Projekt und sein lokal gespeichertes Video endgültig aus diesem Browser entfernt. Das lässt sich nicht rückgängig machen.	Isto remove definitivamente o projeto e o vídeo local deste navegador. Não é possível anular.
This project has been completed by the editor. This review is now read-only.	L’éditeur a terminé ce projet. Cette révision est désormais en lecture seule.	El editor ha completado este proyecto. Esta revisión es ahora de solo lectura.	Der Editor hat dieses Projekt abgeschlossen. Dieses Review ist jetzt schreibgeschützt.	O editor concluiu este projeto. Esta revisão está agora só de leitura.
This project is finished and stored in your completed projects. Reopen it when you need to make more changes.	Ce projet est terminé et archivé. Rouvrez-le si vous devez apporter d’autres modifications.	Este proyecto está terminado y archivado. Vuelve a abrirlo si necesitas hacer cambios.	Dieses Projekt ist abgeschlossen und befindet sich unter „Abgeschlossene Projekte“. Öffne es erneut, wenn du weitere Änderungen vornehmen möchtest.	Este projeto está concluído e arquivado. Reabra-o se precisar de fazer alterações.
This review link is no longer available.	Ce lien de révision n’est plus disponible.	Este enlace de revisión ya no está disponible.	Dieser Review-Link ist nicht mehr verfügbar.	Este link de revisão já não está disponível.
This version is approved. Mark the project complete when the work is finished.	Cette version est approuvée. Marquez le projet comme terminé lorsque le travail est achevé.	Esta versión está aprobada. Marca el proyecto como completado cuando termine el trabajo.	Diese Version ist freigegeben. Markiere das Projekt als abgeschlossen, wenn die Arbeit fertig ist.	Esta versão foi aprovada. Marque o projeto como concluído quando o trabalho terminar.
Toggle fullscreen	Activer ou quitter le plein écran	Activar o salir de pantalla completa	Vollbild umschalten	Alternar ecrã inteiro
Trash is empty	La corbeille est vide	La papelera está vacía	Der Papierkorb ist leer	O lixo está vazio
Trash is full ({count}/{max}). Restore a project or permanently delete one in Trash before deleting another.	La corbeille est pleine ({count}/{max}). Restaurez un projet ou supprimez-en un définitivement avant d’en supprimer un autre.	La papelera está llena ({count}/{max}). Restaura un proyecto o elimina uno definitivamente antes de borrar otro.	Der Papierkorb ist voll ({count}/{max}). Stelle ein Projekt wieder her oder lösche eines im Papierkorb endgültig, bevor du ein weiteres löschst.	O lixo está cheio ({count}/{max}). Restaure um projeto ou elimine um definitivamente antes de eliminar outro.
Trash	Corbeille	Papelera	Papierkorb	Lixo
Try again	Réessayer	Intentar de nuevo	Erneut versuchen	Tentar novamente
Undo	Annuler	Deshacer	Rückgängig	Anular
Unmute video	Rétablir le son	Activar sonido	Ton des Videos einschalten	Ativar som
Unmute	Rétablir le son	Activar sonido	Ton einschalten	Ativar som
Version {version}	Version {version}	Versión {version}	Version {version}	Versão {version}
Video controls	Commandes vidéo	Controles de vídeo	Videosteuerung	Controlos de vídeo
Video file	Fichier vidéo	Archivo de vídeo	Videodatei	Ficheiro de vídeo
Video progress	Progression de la vidéo	Progreso del vídeo	Videofortschritt	Progresso do vídeo
Volume	Volume	Volumen	Lautstärke	Volume
Waiting for client	En attente du client	Esperando al cliente	Warten auf den Kunden	À espera do cliente
We could not complete that account request. Check your connection and try again.	Nous n’avons pas pu traiter cette demande de compte. Vérifiez votre connexion et réessayez.	No pudimos completar esa solicitud de cuenta. Comprueba la conexión e inténtalo de nuevo.	Die Kontoanfrage konnte nicht abgeschlossen werden. Prüfe deine Verbindung und versuche es erneut.	Não foi possível concluir o pedido da conta. Verifique a ligação e tente novamente.
We could not connect your account service. Check your connection and try again.	Impossible de se connecter au service de compte. Vérifiez votre connexion et réessayez.	No pudimos conectar con el servicio de cuenta. Comprueba la conexión e inténtalo de nuevo.	Verbindung zum Kontodienst fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.	Não foi possível ligar ao serviço da conta. Verifique a ligação e tente novamente.
We could not sign you out. Check your connection and try again.	Impossible de vous déconnecter. Vérifiez votre connexion et réessayez.	No pudimos cerrar tu sesión. Comprueba la conexión e inténtalo de nuevo.	Du konntest nicht abgemeldet werden. Prüfe deine Verbindung und versuche es erneut.	Não foi possível terminar a sessão. Verifique a ligação e tente novamente.
We couldn't play this video.	Impossible de lire cette vidéo.	No se pudo reproducir este vídeo.	Dieses Video konnte nicht abgespielt werden.	Não foi possível reproduzir este vídeo.
Welcome back.	Bon retour.	Te damos la bienvenida.	Willkommen zurück.	Bem-vindo novamente.
What needs to change?	Que faut-il modifier ?	¿Qué hay que cambiar?	Was muss geändert werden?	O que precisa de mudar?
What should change?	Que faut-il modifier ?	¿Qué debería cambiar?	Was soll geändert werden?	O que deve mudar?
Will submit at	Sera envoyé à	Se enviará en	Wird gesendet bei	Será enviado em
Working…	Traitement…	Procesando…	Wird bearbeitet…	A processar…
You can still test comments, timestamps, versioning, and the client preview without a video file.	Vous pouvez tester les commentaires, les horodatages, les versions et l’aperçu client sans vidéo.	Puedes probar los comentarios, las marcas de tiempo, las versiones y la vista previa sin un vídeo.	Auch ohne Videodatei kannst du Kommentare, Zeitstempel, Versionen und die Kundenvorschau testen.	Pode testar comentários, marcas temporais, versões e a pré-visualização sem um vídeo.
Your account is connected.	Votre compte est connecté.	Tu cuenta está conectada.	Dein Konto ist verbunden.	A sua conta está ligada.
Your account will own your projects and control who can access them.	Votre compte possédera vos projets et contrôlera qui peut y accéder.	Tu cuenta será propietaria de tus proyectos y controlará quién puede acceder a ellos.	Dein Konto verwaltet deine Projekte und steuert, wer darauf zugreifen kann.	A sua conta será proprietária dos projetos e controlará quem pode aceder-lhes.
Your changes could not be saved.	Vos modifications n’ont pas pu être enregistrées.	No se pudieron guardar los cambios.	Deine Änderungen konnten nicht gespeichert werden.	Não foi possível guardar as alterações.
Your feedback	Vos commentaires	Tus comentarios	Dein Feedback	O seu feedback
Your name	Votre nom	Tu nombre	Dein Name	O seu nome
You’re signed in.	Vous êtes connecté.	Has iniciado sesión.	Du bist angemeldet.	Iniciou sessão.
comments	commentaires	comentarios	Kommentare	comentários
e.g. Make this shot a little shorter	Ex. : Raccourcir un peu ce plan	P. ej., acortar un poco este plano	z. B. Diese Einstellung etwas kürzer machen	Ex.: tornar este plano um pouco mais curto
{count} of {max} Trash slots used. Restore a project or delete one forever to make room for another.	{count} place(s) sur {max} utilisées dans la corbeille. Restaurez ou supprimez définitivement un projet pour libérer une place.	Se usan {count} de {max} espacios de la papelera. Restaura o elimina un proyecto definitivamente para liberar espacio.	{count} von {max} Papierkorbplätzen belegt. Stelle ein Projekt wieder her oder lösche eines endgültig, um Platz zu schaffen.	{count} de {max} lugares do lixo ocupados. Restaure ou elimine um projeto definitivamente para libertar espaço.
{pending} open · {resolved} resolved	{pending} ouverts · {resolved} résolus	{pending} abiertos · {resolved} resueltos	{pending} offen · {resolved} erledigt	{pending} em aberto · {resolved} resolvidos
The editor has not added a video file yet. You can still test the feedback and approval flow here.	L’éditeur n’a pas encore ajouté de vidéo. Vous pouvez tout de même tester les commentaires et l’approbation ici.	El editor aún no ha añadido un vídeo. Aquí puedes probar los comentarios y la aprobación.	Der Editor hat noch keine Videodatei hinzugefügt. Du kannst hier trotzdem den Feedback- und Freigabeablauf testen.	O editor ainda não adicionou um vídeo. Pode testar aqui os comentários e a aprovação.
There is no feedback yet. Start by pausing the video where you want a change.	Il n’y a pas encore de commentaire. Mettez la vidéo en pause là où vous souhaitez un changement.	Aún no hay comentarios. Pausa el vídeo donde quieras un cambio.	Es gibt noch kein Feedback. Pausiere zuerst das Video an der Stelle, an der du eine Änderung möchtest.	Ainda não há feedback. Pause o vídeo no ponto em que pretende uma alteração.
You are reviewing a client link. No account is needed for this prototype.	Vous consultez un lien client. Aucun compte n’est nécessaire pour ce prototype.	Estás revisando un enlace de cliente. Este prototipo no requiere cuenta.	Du nutzt einen Kundenlink. Für diesen Prototyp ist kein Konto erforderlich.	Está a rever um link de cliente. Este protótipo não exige conta.
There is no video attached to this project yet.	Aucune vidéo n’est encore associée à ce projet.	Este proyecto aún no tiene ningún vídeo adjunto.	An dieses Projekt ist noch kein Video angehängt.	Ainda não há vídeo associado a este projeto.
You have no permission to view this project.	Vous n’avez pas l’autorisation de consulter ce projet.	No tienes permiso para ver este proyecto.	Du hast keine Berechtigung, dieses Projekt anzusehen.	Não tem permissão para ver este projeto.
Language	Langue	Idioma	Sprache	Idioma
Cookie settings	Paramètres des cookies	Ajustes de cookies	Cookie-Einstellungen	Definições de cookies
Cookie information	Informations sur les cookies	Información sobre cookies	Cookie-Informationen	Informações sobre cookies
We use first-party functional cookies to remember your language and this notice. ReviewFlow does not use analytics or advertising cookies.	Nous utilisons des cookies fonctionnels internes pour mémoriser votre langue et ce message. ReviewFlow n’utilise pas de cookies d’analyse ou de publicité.	Usamos cookies funcionales propios para recordar tu idioma y este aviso. ReviewFlow no usa cookies de analítica ni publicidad.	Wir verwenden eigene funktionale Cookies, um deine Sprache und diesen Hinweis zu speichern. ReviewFlow verwendet keine Analyse- oder Werbe-Cookies.	Usamos cookies funcionais próprios para memorizar o idioma e este aviso. O ReviewFlow não usa cookies de análise nem publicidade.
Cookie notice	Avis sur les cookies	Aviso sobre cookies	Cookie-Hinweis	Aviso de cookies
Got it	Compris	Entendido	Verstanden	Entendi
Cookie details	Détails des cookies	Detalles de cookies	Cookie-Details	Detalhes dos cookies
Only functional cookies	Cookies fonctionnels uniquement	Solo cookies funcionales	Nur funktionale Cookies	Apenas cookies funcionais
Remember language	Mémoriser la langue	Recordar idioma	Sprache speichern	Memorizar idioma
No optional cookies are enabled in this version.	Aucun cookie facultatif n’est activé dans cette version.	Esta versión no activa cookies opcionales.	In dieser Version sind keine optionalen Cookies aktiviert.	Esta versão não ativa cookies opcionais.
Save settings	Enregistrer les paramètres	Guardar ajustes	Einstellungen speichern	Guardar definições
Close	Fermer	Cerrar	Schließen	Fechar
Primary navigation	Navigation principale	Navegación principal	Hauptnavigation	Navegação principal
Local prototype	Prototype local	Prototipo local	Lokaler Prototyp	Protótipo local
Switch to {mode}	Passer en mode {mode}	Cambiar a modo {mode}	Zu {mode} wechseln	Mudar para o modo {mode}
Light mode	Mode clair	Modo claro	Heller Modus	Modo claro
Dark mode	Mode sombre	Modo oscuro	Dunkler Modus	Modo escuro
Client preview	Aperçu client	Vista previa del cliente	Kundenvorschau	Pré-visualização do cliente
Account	Compte	Cuenta	Konto	Conta
The editor has not uploaded a video yet.	L’éditeur n’a pas encore importé de vidéo.	El editor aún no ha subido un vídeo.	Der Editor hat noch kein Video hochgeladen.	O editor ainda não carregou um vídeo.
We could not load the Supabase account service. Check your connection and try again.	Impossible de charger le service de compte Supabase. Vérifiez votre connexion et réessayez.	No se pudo cargar el servicio de cuenta de Supabase. Comprueba la conexión e inténtalo de nuevo.	Der Supabase-Kontodienst konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.	Não foi possível carregar o serviço de conta Supabase. Verifique a ligação e tente novamente.
Something went wrong	Un problème est survenu	Algo salió mal	Ein Fehler ist aufgetreten	Ocorreu um erro
ReviewFlow couldn't load this page.	ReviewFlow n’a pas pu charger cette page.	ReviewFlow no pudo cargar esta página.	ReviewFlow konnte diese Seite nicht laden.	O ReviewFlow não conseguiu carregar esta página.
Your saved projects should still be in this browser. Reload the page and try again.	Vos projets enregistrés devraient toujours être dans ce navigateur. Rechargez la page et réessayez.	Tus proyectos guardados deberían seguir en este navegador. Recarga la página e inténtalo de nuevo.	Deine gespeicherten Projekte sollten weiterhin in diesem Browser vorhanden sein. Lade die Seite neu und versuche es erneut.	Os projetos guardados deverão continuar neste navegador. Recarregue a página e tente novamente.
Technical details	Détails techniques	Detalles técnicos	Technische Details	Detalhes técnicos
Reload ReviewFlow	Recharger ReviewFlow	Recargar ReviewFlow	ReviewFlow neu laden	Recarregar o ReviewFlow

A saved video could not be found. Try re-uploading the video in this project.	Vidéo introuvable. Essayez de l’importer à nouveau dans ce projet.	No se encontró el vídeo guardado. Vuelve a subirlo en este proyecto.	Ein gespeichertes Video wurde nicht gefunden. Lade es in diesem Projekt erneut hoch.	Não foi possível encontrar o vídeo guardado. Tente carregá-lo novamente neste projeto.
A saved video could not be loaded. Try reopening the project or re-uploading the video.	Impossible de charger la vidéo enregistrée. Rouvrez le projet ou importez à nouveau la vidéo.	No se pudo cargar el vídeo guardado. Vuelve a abrir el proyecto o sube el vídeo de nuevo.	Ein gespeichertes Video konnte nicht geladen werden. Öffne das Projekt erneut oder lade das Video noch einmal hoch.	Não foi possível carregar o vídeo guardado. Reabra o projeto ou carregue o vídeo novamente.
Leave feedback at a specific moment or approve the video when you're happy.	Laissez un commentaire à un instant précis ou approuvez la vidéo lorsqu’elle vous convient.	Deja comentarios en un momento concreto o aprueba el vídeo cuando estés satisfecho.	Hinterlasse Feedback an einer bestimmten Stelle oder gib das Video frei, wenn du zufrieden bist.	Deixe feedback num momento específico ou aprove o vídeo quando estiver satisfeito.
Project moved to Trash.	Projet déplacé vers la corbeille.	Proyecto movido a la papelera.	Projekt in den Papierkorb verschoben.	Projeto movido para o lixo.
Required	Obligatoire	Obligatorio	Erforderlich	Obrigatório
✓ Version approved	✓ Version approuvée	✓ Versión aprobada	✓ Version freigegeben	✓ Versão aprovada
Enter a project name and client name before creating the project.	Saisissez un nom de projet et un nom de client avant de créer le projet.	Introduce el nombre del proyecto y del cliente antes de crearlo.	Gib vor dem Erstellen des Projekts einen Projektnamen und einen Kundennamen ein.	Introduza o nome do projeto e do cliente antes de criar o projeto.
Enter a project name before creating the project.	Saisissez un nom de projet avant de le créer.	Introduce el nombre del proyecto antes de crearlo.	Gib vor dem Erstellen des Projekts einen Projektnamen ein.	Introduza o nome do projeto antes de o criar.
Enter a client name before creating the project.	Saisissez un nom de client avant de créer le projet.	Introduce el nombre del cliente antes de crear el proyecto.	Gib vor dem Erstellen des Projekts einen Kundennamen ein.	Introduza o nome do cliente antes de criar o projeto.
Select a video file before creating the project.	Sélectionnez un fichier vidéo avant de créer le projet.	Selecciona un archivo de vídeo antes de crear el proyecto.	Wähle vor dem Erstellen des Projekts eine Videodatei aus.	Selecione um ficheiro de vídeo antes de criar o projeto.

Your email or password could not be accepted. Check your details and try again.	Votre e-mail ou mot de passe n’a pas été accepté. Vérifiez vos informations et réessayez.	No se ha aceptado el correo o la contraseña. Comprueba los datos e inténtalo de nuevo.	Deine E-Mail-Adresse oder dein Passwort wurde nicht akzeptiert. Prüfe deine Angaben und versuche es erneut.	O email ou a palavra-passe não foram aceites. Verifique os dados e tente novamente.

You	Vous	Tú	Du	Você
ReviewFlow — Client approvals without the mess	ReviewFlow — Les validations client, en toute simplicité	ReviewFlow — Aprobaciones de clientes sin complicaciones	ReviewFlow — Kundenfreigaben ohne Chaos	ReviewFlow — Aprovações de clientes sem complicações`.trim()

const rows = rowsText.split('\n').filter((line) => line.length > 0).map((line) => {
  const parts = line.split('\t')
  if (parts.length !== 5) throw new Error(`Invalid translation row: ${parts[0]}`)
  return parts
})

export const messages = Object.freeze({
  en: Object.freeze(Object.fromEntries(rows.map(([key]) => [key, key]))),
  fr: Object.freeze(Object.fromEntries(rows.map(([key, fr]) => [key, fr]))),
  es: Object.freeze(Object.fromEntries(rows.map(([key, _fr, es]) => [key, es]))),
  de: Object.freeze(Object.fromEntries(rows.map(([key, _fr, _es, de]) => [key, de]))),
  pt: Object.freeze(Object.fromEntries(rows.map(([key, _fr, _es, _de, pt]) => [key, pt]))),
})

export function normalizeLocale(value) {
  if (typeof value !== 'string') return null
  const normalized = value.toLowerCase().split(/[-_]/)[0]
  return supported.has(normalized) ? normalized : null
}

export function getCookieValue(cookieString, name) {
  if (typeof cookieString !== 'string' || !name) return null
  for (const part of cookieString.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    const key = part.slice(0, separator).trim()
    if (key !== name) continue
    try { return decodeURIComponent(part.slice(separator + 1).trim()) } catch { return null }
  }
  return null
}

export function getLocaleFromPreferences(cookieString, preferredLanguages = []) {
  const saved = normalizeLocale(getCookieValue(cookieString, COOKIE_NAMES.locale))
  if (saved) return saved
  for (const candidate of preferredLanguages) {
    const locale = normalizeLocale(candidate)
    if (locale) return locale
  }
  return 'en'
}

export function buildPreferenceCookie(name, value, secure = false) {
  if (!Object.values(COOKIE_NAMES).includes(name)) throw new Error('Unsupported preference cookie')
  if (name === COOKIE_NAMES.locale && !supported.has(value)) throw new Error('Unsupported language preference')
  if (name === COOKIE_NAMES.notice && value !== 'seen') throw new Error('Unsupported cookie notice preference')
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax${secure ? '; Secure' : ''}`
}

export function hasSeenCookieNotice(cookieString) {
  return getCookieValue(cookieString, COOKIE_NAMES.notice) === 'seen'
}

export function translate(locale, key, values = {}) {
  const dictionary = messages[normalizeLocale(locale) ?? 'en'] ?? messages.en
  const template = dictionary[key] ?? messages.en[key] ?? key
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (match, name) => (
    Object.hasOwn(values, name) ? String(values[name]) : match
  ))
}

export function getTranslationStats() {
  return Object.fromEntries(Object.entries(messages).map(([locale, dictionary]) => [locale, Object.keys(dictionary).length]))
}

export const REQUIRED_TRANSLATION_KEYS = Object.freeze(rows.map(([key]) => key))
