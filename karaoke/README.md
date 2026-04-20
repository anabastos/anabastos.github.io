# Karaoke (GitHub Pages + Firebase)

Esse projeto roda estatico no GitHub Pages e usa Firebase para:
- autenticacao
- fila em tempo real no Firestore
- player de YouTube para o host

## Paginas

- `index.html`: hub com links de entrada.
- `request.html`: fluxo de convidados para enviar musica.
- `player.html`: fluxo do host para reproduzir e avancar fila.

Use a mesma sala com query string em ambas, por exemplo `?room=festa`.

## 1) Config Firebase no frontend

Edite `firebase.js` e preencha o objeto `firebaseConfig` com os dados do Web App Firebase.

Importante:
- Esses dados sao publicos em apps web.
- Nao coloque service account, private key ou Admin SDK no frontend.

## 2) Ativar Auth no Firebase

No console do Firebase, em Authentication > Sign-in method:
- habilite `Anonymous` (convidados)
- habilite `Email/Password` (host)

## 3) Publicar Firestore Rules

Copie o conteudo de `firestore.rules` para Firestore Database > Rules e publique.

Essas regras fazem:
- leitura publica da fila
- criacao de pedido apenas para usuario autenticado
- update/delete apenas para host da sala

## 4) Como marcar um host da sala

1. O host faz login em `player.html` com email/senha.
2. Copie o UID mostrado na tela.
3. No Firestore, crie o documento:
   - collection: `rooms`
   - doc id: `<roomId>`
   - subcollection: `hosts`
   - doc id: `<uid-do-host>`
4. Depois disso, esse usuario passa a controlar `Proximo`, `Tocar agora` e `Remover`.

## 5) Sobre secrets no GitHub

Se voce so usa GitHub Pages, nao precisa GitHub Secrets para o frontend Firebase.

GitHub Secrets so sao necessarios para pipelines (CI/CD), por exemplo deploy via GitHub Actions com Firebase Hosting.
