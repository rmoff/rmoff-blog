# Where should we write the GIF?
Output ../../../static/images/2024/04/help2.mp4

# Set up a 1200x600 terminal with 46px font.
Set Padding 10
Set FontSize 15
Set Width 800
Set Height 500
Set Shell zsh
Set WindowBar Colorful

Hide
Type "export AWS_PAGER=less && clear"
Enter
Show

# Type a command in the terminal.
Type "aws iam list-role-policies --role-name rmoff-decodable-s3"
Sleep 500ms
Enter

Sleep 2s
Type "q"


# Admire the output for a bit.
Sleep 1s
