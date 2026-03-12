FROM hugomods/hugo:0.157.0

# Install Ruby and AsciiDoctor
RUN apk add --no-cache \
    ruby \
    ruby-dev \
    build-base \
    && gem install asciidoctor asciidoctor-revealjs --no-document \
    && gem install rouge -v 3.30.0 --no-document \
    && apk del build-base ruby-dev

COPY lib/rouge_sql_jinja.rb /usr/local/lib/site_ruby/3.4.0/rouge_sql_jinja.rb

WORKDIR /src

ENTRYPOINT ["hugo"]
