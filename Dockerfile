FROM mcr.microsoft.com/playwright:focal

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN npm install -g concurrently

CMD concurrently "node ./cvs/cvs.js" "node ./walmart/walmart.js" "node ./target/target.js" "node ./walgreens/walgreens.js" "node ./optum/optum.js" "node ./ongo-direct/ongo.js" "node ./ihealth/ihealth.js"