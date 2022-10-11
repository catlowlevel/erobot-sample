FROM ubuntu
# Install Node.js, Yarn and required dependencies
RUN apt-get update \
  && apt-get install -y curl gnupg build-essential \
  && curl --silent --location https://deb.nodesource.com/setup_16.x | bash - \
  && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && apt-get remove -y --purge cmdtest \
  && apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev git -y \
  && apt-get update \
  && apt-get install -y nodejs yarn \
  # Puppeteer deps
  && apt-get install ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils -y
  # remove useless files from the current layer
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /var/lib/apt/lists.d/* \
  && apt-get autoremove \
  && apt-get clean \
  && apt-get autoclean 


RUN adduser --disabled-password --gecos "" --uid 1000 node

USER 1000
WORKDIR /home/node

COPY package.json ./
COPY yarn.lock ./

#RUN yarn install
#https://github.com/yarnpkg/yarn/issues/2629#issuecomment-685088015
RUN yarn install --check-files --cache-folder .ycache && rm -rf .ycache
COPY . .

CMD ["yarn","dev"]