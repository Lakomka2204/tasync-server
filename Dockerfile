FROM node:slim
WORKDIR /app
COPY packag*.json .
RUN npm i
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]