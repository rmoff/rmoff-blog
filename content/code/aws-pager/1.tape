# Where should we write the GIF?
Output ../../../static/images/2024/04/help1.mp4

# Set up a 1200x600 terminal with 46px font.
Set Padding 10
Set FontSize 15
Set Width 800
Set Height 500
Set Shell zsh
Set WindowBar Colorful

# Type a command in the terminal.
Type `export MANPAGER='less -isXF'`
Sleep 1s
Enter

Type "aws iam create-role help"
Sleep 500ms
Enter

Sleep 2s
Type "q"

# Admire the output for a bit.
Sleep 1s
