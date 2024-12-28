# Voxta Calendar Provider

Ce provider permet de générer des calendriers quotidiens pour les compagnons dans [Voxta](https://github.com/VoxTA/VoxTA). Il crée des activités uniques par jour qui sont ensuite injectées dans le contexte de la conversation, permettant ainsi à l'IA d'y faire référence naturellement.

*Note : Ce projet n'est pas officiellement associé au projet Voxta.*

## Fonctionnalités

- Génération de plannings quotidiens personnalisés
- Injection automatique dans le contexte de conversation
- Prise en compte de l'historique des activités

## Installation

Assurez-vous d'avoir Node.js installé sur votre système, puis :

```bash
npm install
```

## Utilisation

1. Assurez-vous que votre instance Voxta est en cours d'exécution
2. Lancez le provider :
```bash
node app.js
```
3. Initiez une conversation avec votre compagnon dans Voxta

Le planning généré sera automatiquement intégré au contexte de la conversation.
