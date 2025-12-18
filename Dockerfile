FROM hugomods/hugo:0.152.2

# Install Ruby and AsciiDoctor
RUN apk add --no-cache \
    ruby \
    ruby-dev \
    build-base \
    && gem install asciidoctor asciidoctor-revealjs --no-document \
    && gem install rouge -v 3.30.0 --no-document \
    && apk del build-base ruby-dev

WORKDIR /src

ENTRYPOINT ["hugo"]
