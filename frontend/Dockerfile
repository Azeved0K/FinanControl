FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código da aplicação
COPY . .

# Expor porta do Vite
EXPOSE 5173

# Comando de desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]