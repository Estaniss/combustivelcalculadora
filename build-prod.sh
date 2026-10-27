    #!/bin/bash

echo "Atualizando repositório..."
git pull

echo "Limpando projeto..."
rm -rf node_modules package-lock.json

echo "Instalando dependências..."
npm install


echo "Gerando build Android..."
eas build --platform android --profile production --clear-cache

echo "Processo concluído."