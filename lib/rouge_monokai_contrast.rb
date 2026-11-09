require 'rouge'

# Rouge's `monokai` theme paints code on #49483e, which is Monokai's line-highlight
# colour rather than its background. This keeps that theme's token mapping and
# changes only the colours that miss WCAG AA (4.5:1) on Monokai's real background.
class Rouge::Themes::MonokaiContrast < Rouge::Themes::Monokai
  name 'monokai-contrast'

  palette :dark        => '#272822' # background, was #49483e
  palette :bright_pink => '#fa4e8c' # operators, was #f92672
  palette :dimgrey     => '#94907a' # comments, was #75715e
  palette :carmine     => '#ed007e' # error tokens on #1e0010, was #960050
  palette :dark_grey   => '#909090' # program output, was #888888
  palette :emperor     => '#909090' # shell prompts, was #555555
  palette :dark_red    => '#f25c5c' # generic errors and tracebacks, was #aa0000

  style Generic::Emph, :fg => :whitish, :italic => true # was black
end
