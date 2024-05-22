# Aplicação de Processamento de Imagens com Node.js e AWS S3

Esta é uma aplicação Node.js que permite o processamento de imagens a partir de alguns parâmetros e entrega o conteúdo otimizado e com baixa latência para o usuário final. As imagens originais são armazenadas em um bucket no AWS S3.

## Pré-requisitos

Certifique-se de ter instalado o Node.js e o npm em sua máquina. Você também precisará configurar uma conta na AWS e ter as credenciais de acesso (Access Key ID e Secret Access Key) disponíveis.

## Instalação

1. Clone este repositório em sua máquina local
2. Acesse o diretório da aplicação
3. Instale as dependências usando npm:

```bash
    npm install
```

## Configuração

Antes de executar a aplicação, é necessário configurar suas credenciais da AWS. Você pode fazer isso definindo variáveis de ambiente ou utilizando o AWS CLI.

Exemplo de configuração das variáveis de ambiente:

```bash
export AWS_ACCESS_KEY_ID=seu-access-key-id
export AWS_SECRET_ACCESS_KEY=sua-secret-access-key
export S3_BUCKET=nome-do-seu-bucket
```

## Uso

Para iniciar o servidor da aplicação, execute o seguinte comando:

```bash
    npm start
```

A aplicação estará disponível em `http://localhost:3000`.

Você pode acessar as imagens utilizando a seguinte URL:
```bash
http://localhost:3000/pictures/nome-da-imagem.png?fm=webp&q=75&w=128&h=128&gray=0
```

Substitua `nome-da-imagem.png` pelo nome da imagem desejada e ajuste os parâmetros conforme necessário.

### Parâmetros

- **fm**: Formato da imagem desejado. Opções disponíveis: JPG, PNG e WEBP. O formato padrão é determinado automaticamente.
- **q**: Qualidade da imagem. Um número inteiro entre 1 e 100. Quanto menor o número, menor será a qualidade da imagem.
- **w**: Largura desejada da imagem.
- **h**: Altura desejada da imagem.
- **gray**: Se definido como 1, a imagem será convertida para escala de cinza.

### Entrega com o melhor tempo de resposta

Para alcançar uma entrega diretamente do bucket de forma mais rápida levando em consideração posicionamento geográfico é aconselhado utilizar CDN para realizar a distribuição.

