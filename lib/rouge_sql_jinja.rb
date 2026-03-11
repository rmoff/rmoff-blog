require 'rouge'

class Rouge::Lexers::SqlJinja < Rouge::Lexers::Jinja
  tag 'sql+jinja'
  title 'SQL+Jinja'
  desc 'SQL with Jinja2 templating'

  def initialize(opts = {})
    super(opts.merge(parent: 'sql'))
  end

  # Redefine :literal to add ~ (concat) and % (modulo) operators
  state :literal do
    rule %r/"(\\.|.)*?"/, Str::Double
    rule %r/'(\\.|.)*?'/, Str::Single
    rule %r/\d+(?=}\s)/, Num
    rule %r/(\+|\-|\*|\/\/?|\*\*?|=|~|%)/, Operator
    rule %r/(<=?|>=?|===?|!=)/, Operator
    rule %r/,/, Punctuation
    rule %r/\[/, Punctuation
    rule %r/\]/, Punctuation
    rule %r/\(/, Punctuation
    rule %r/\)/, Punctuation
  end
end
