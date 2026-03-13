#!/usr/bin/env python3
"""Convert Claude session JSONL to AsciiDoc blog post.

Usage:
    python3 jsonl-to-adoc.py <output.jsonl> [-o output.adoc]
    python3 jsonl-to-adoc.py runs/D-rich-with-skills/claude-sonnet-4-6/run-1/

Reads output.jsonl directly (no dashboard intermediary) and produces
full-fidelity AsciiDoc with ev-* role classes for blog CSS.
"""

import json
import sys
import os
import argparse
import re


def escape_inline(s):
    """Escape AsciiDoc inline formatting characters in plain text.

    Backticks, double-underscores, and curly braces trigger inline monospace,
    italic, and attribute substitution in AsciiDoc. We escape them so the
    text renders as-is (no yellow code highlights, no missing text).
    """
    if not s:
        return s
    s = s.replace('`', '\\`')
    s = s.replace('{', '\\{')
    s = s.replace('}', '\\}')
    return s


def single_line(s):
    """Collapse newlines to spaces so AsciiDoc doesn't split paragraphs."""
    if not s:
        return ''
    return re.sub(r'\s+', ' ', s).strip()


def strip_ansi(s):
    """Remove ANSI escape sequences (color codes, cursor moves, etc.)."""
    if not s:
        return s
    return re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', s)


def clean_tool_output(s):
    """Clean raw tool output: strip ANSI codes, normalize whitespace."""
    if not s:
        return ''
    s = strip_ansi(s)
    # Strip trailing whitespace per line, collapse trailing blank lines
    lines = [line.rstrip() for line in s.split('\n')]
    # Remove trailing empty lines
    while lines and not lines[-1]:
        lines.pop()
    return '\n'.join(lines)


def escape_source(s):
    """Escape ---- inside source blocks by adding a zero-width space."""
    if not s:
        return ''
    return s.replace('----', '-\u200b---')


def summarize_tool(name, inp):
    """Extract a brief description from tool input dict."""
    if name in ('Read', 'Write'):
        return inp.get('file_path', '')
    if name == 'Edit':
        return inp.get('file_path', '')
    if name == 'Bash':
        cmd = inp.get('command', '')
        # First line only
        return cmd.split('\n')[0]
    if name == 'Glob':
        pattern = inp.get('pattern', '')
        path = inp.get('path', '')
        return f'{pattern}' + (f' in {path}' if path else '')
    if name == 'Grep':
        pattern = inp.get('pattern', '')
        path = inp.get('path', '')
        return f'/{pattern}/' + (f' in {path}' if path else '')
    if name == 'WebFetch':
        return inp.get('url', '')
    if name == 'WebSearch':
        return inp.get('query', '')
    if name == 'Agent':
        return inp.get('prompt', inp.get('description', ''))[:120]
    if name == 'TodoWrite':
        todos = inp.get('todos', [])
        return f'{len(todos)} items'
    if name == 'NotebookEdit':
        return inp.get('file_path', '')
    # Generic: try common keys
    for key in ('file_path', 'path', 'query', 'command', 'prompt', 'description'):
        if key in inp:
            val = str(inp[key])
            return val[:120]
    return ''


def process_jsonl(jsonl_path, summary_data=None):
    """Process JSONL file and return list of AsciiDoc lines."""
    lines = []

    with open(jsonl_path) as f:
        for raw_line in f:
            raw_line = raw_line.strip()
            if not raw_line:
                continue
            try:
                event = json.loads(raw_line)
            except json.JSONDecodeError:
                continue

            etype = event.get('type')

            # ── System events ──
            if etype == 'system':
                subtype = event.get('subtype', '')
                if subtype == 'init':
                    continue  # skip init
                # Compaction boundary or other system events
                label = event.get('message', '') or subtype or 'system event'
                lines.append('[.ev-system]')
                lines.append(f'! {escape_inline(single_line(str(label)))}')
                lines.append('')

            # ── Result events (session end) ──
            elif etype == 'result':
                subtype = event.get('subtype', '')
                result_text = event.get('result', '')
                if subtype == 'success' and result_text:
                    lines.append('[.ev-text]')
                    lines.append(escape_inline(single_line(result_text)))
                    lines.append('')

            # ── Assistant messages ──
            elif etype == 'assistant':
                content = event.get('message', {}).get('content', [])
                if not isinstance(content, list):
                    continue
                for block in content:
                    btype = block.get('type')

                    if btype == 'text':
                        text = block.get('text', '')
                        if text.strip():
                            lines.append('[.ev-text]')
                            lines.append(escape_inline(single_line(text)))
                            lines.append('')

                    elif btype == 'thinking':
                        thinking = block.get('thinking', '')
                        if thinking.strip():
                            lines.append('[.ev-thinking]')
                            lines.append(escape_inline(single_line(thinking)))
                            lines.append('')

                    elif btype == 'tool_use':
                        name = block.get('name', 'Tool')
                        inp = block.get('input', {})
                        brief = escape_inline(summarize_tool(name, inp))
                        lines.append('[.ev-tool]')
                        lines.append(f'**{name}** {brief}' if brief else f'**{name}**')
                        lines.append('')

                        # Write: collapsible file content
                        if name == 'Write' and inp.get('content'):
                            file_content = inp['content']
                            # Detect language from file extension
                            fp = inp.get('file_path', '')
                            ext = os.path.splitext(fp)[1].lstrip('.')
                            lang_map = {
                                'py': 'python', 'sql': 'sql', 'yml': 'yaml',
                                'yaml': 'yaml', 'json': 'json', 'sh': 'bash',
                                'js': 'javascript', 'ts': 'typescript',
                                'md': 'markdown', 'toml': 'toml', 'csv': 'csv',
                            }
                            lang = lang_map.get(ext, '')
                            lines.append('[.ev-detail]')
                            lines.append('[%collapsible]')
                            lines.append(f'.{os.path.basename(fp)}')
                            lines.append('====')
                            lines.append(f'[source,{lang}]' if lang else '[source]')
                            lines.append('----')
                            lines.append(escape_source(file_content))
                            lines.append('----')
                            lines.append('====')
                            lines.append('')

                        # Edit: collapsible diff
                        if name == 'Edit' and (inp.get('old_string') or inp.get('new_string')):
                            lines.append('[.ev-detail]')
                            lines.append('[%collapsible]')
                            lines.append('.diff')
                            lines.append('====')
                            if inp.get('old_string'):
                                lines.append('.old')
                                lines.append('[source]')
                                lines.append('----')
                                lines.append(escape_source(inp['old_string']))
                                lines.append('----')
                            if inp.get('new_string'):
                                lines.append('.new')
                                lines.append('[source]')
                                lines.append('----')
                                lines.append(escape_source(inp['new_string']))
                                lines.append('----')
                            lines.append('====')
                            lines.append('')

                        # Bash: collapsible command (if multiline)
                        if name == 'Bash' and inp.get('command'):
                            cmd = inp['command']
                            if '\n' in cmd:
                                lines.append('[.ev-detail]')
                                lines.append('[%collapsible]')
                                lines.append('.command')
                                lines.append('====')
                                lines.append('[source,bash]')
                                lines.append('----')
                                lines.append(escape_source(cmd))
                                lines.append('----')
                                lines.append('====')
                                lines.append('')

            # ── User messages ──
            elif etype == 'user':
                content = event.get('message', {}).get('content', '')

                # String content = human turn
                if isinstance(content, str):
                    if content.strip():
                        lines.append('[.ev-user]')
                        lines.append(escape_inline(single_line(content)))
                        lines.append('')

                # Array content = tool results and/or subagent prompts
                elif isinstance(content, list):
                    for block in content:
                        btype = block.get('type')

                        if btype == 'text':
                            text = block.get('text', '')
                            if text.strip():
                                lines.append('[.ev-user]')
                                lines.append(escape_inline(single_line(text)))
                                lines.append('')

                        elif btype == 'tool_result':
                            is_error = block.get('is_error', False)
                            # Content can be string or list of content blocks
                            result_content = block.get('content', '')
                            if isinstance(result_content, list):
                                # Extract text from content blocks
                                texts = []
                                for rb in result_content:
                                    if isinstance(rb, dict) and rb.get('type') == 'text':
                                        texts.append(rb.get('text', ''))
                                    elif isinstance(rb, str):
                                        texts.append(rb)
                                result_content = '\n'.join(texts)

                            cleaned = clean_tool_output(str(result_content))
                            is_multiline = '\n' in cleaned

                            if is_error:
                                if is_multiline:
                                    # First line as summary, full output in collapsible block
                                    first_line = cleaned.split('\n')[0]
                                    lines.append('[.ev-error]')
                                    lines.append(f'x {escape_inline(single_line(first_line))}')
                                    lines.append('')
                                    lines.append('[.ev-detail]')
                                    lines.append('[%collapsible]')
                                    lines.append('.Full error output')
                                    lines.append('====')
                                    lines.append('[source]')
                                    lines.append('----')
                                    lines.append(escape_source(cleaned))
                                    lines.append('----')
                                    lines.append('====')
                                    lines.append('')
                                else:
                                    lines.append('[.ev-error]')
                                    lines.append(f'x {escape_inline(cleaned)}')
                                    lines.append('')
                            else:
                                if is_multiline:
                                    first_line = cleaned.split('\n')[0]
                                    lines.append('[.ev-result]')
                                    lines.append(f'← {escape_inline(single_line(first_line))}')
                                    lines.append('')
                                    lines.append('[.ev-detail]')
                                    lines.append('[%collapsible]')
                                    lines.append('.Full output')
                                    lines.append('====')
                                    lines.append('[source]')
                                    lines.append('----')
                                    lines.append(escape_source(cleaned))
                                    lines.append('----')
                                    lines.append('====')
                                    lines.append('')
                                else:
                                    lines.append('[.ev-result]')
                                    lines.append(f'← {escape_inline(cleaned)}')
                                    lines.append('')

    return lines


def build_front_matter(jsonl_path, summary_data=None):
    """Build Hugo front matter from path and summary."""
    lines = ['---']

    # Try to extract scenario/model/run from path
    parts = jsonl_path.split(os.sep)
    # Look for runs/<scenario>/<model>/<run>/output.jsonl pattern
    title_parts = []
    for i, p in enumerate(parts):
        if p == 'runs' and i + 3 < len(parts):
            scenario = parts[i + 1]
            model = parts[i + 2]
            run = parts[i + 3] if parts[i + 3] != 'output.jsonl' else ''
            title_parts = [scenario, model]
            if run:
                title_parts.append(run)
            break

    if title_parts:
        title = ' / '.join(title_parts)
    else:
        title = os.path.basename(os.path.dirname(jsonl_path))

    lines.append(f"title: 'Claude Session: {title}'")
    from datetime import datetime, timezone
    lines.append(f'date: "{datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}"')
    lines.append('draft: true')
    lines.append('categories:')
    lines.append('- dbt')
    lines.append('- Claude')
    lines.append('- AI')

    if summary_data:
        lines.append('params:')
        if 'model_actual' in summary_data:
            lines.append(f'  model: {summary_data["model_actual"]}')
        if 'num_turns' in summary_data:
            lines.append(f'  turns: {summary_data["num_turns"]}')
        if 'cost_usd' in summary_data:
            lines.append(f'  cost: ${summary_data["cost_usd"]:.4f}')
        if 'duration_ms' in summary_data:
            dur = summary_data['duration_ms'] / 1000
            lines.append(f'  duration: {dur:.1f}s')

    lines.append('---')
    lines.append('')
    return '\n'.join(lines)


CLICK_TO_EXPAND_SCRIPT = """\
++++
<script>
document.querySelectorAll('.paragraph[class*="ev-"]').forEach(el => {
  const p = el.querySelector("p");
  if (!p) return;
  el.style.overflow = "visible";
  const natural = p.scrollWidth;
  el.style.overflow = "";
  if (natural > el.clientWidth) {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      const expanded = el.style.whiteSpace === "normal";
      el.style.whiteSpace = expanded ? "nowrap" : "normal";
      el.style.overflow = expanded ? "" : "visible";
      el.style.textOverflow = expanded ? "" : "unset";
    });
  }
});
</script>
++++
"""


def main():
    parser = argparse.ArgumentParser(description='Convert Claude JSONL to AsciiDoc')
    parser.add_argument('path', help='Path to output.jsonl or run directory')
    parser.add_argument('-o', '--output', help='Output file (default: stdout)')
    parser.add_argument('--no-frontmatter', action='store_true',
                        help='Skip Hugo front matter')
    args = parser.parse_args()

    # Resolve path
    path = args.path.rstrip('/')
    if os.path.isdir(path):
        jsonl_path = os.path.join(path, 'output.jsonl')
        summary_path = os.path.join(path, 'summary.json')
    else:
        jsonl_path = path
        summary_path = os.path.join(os.path.dirname(path), 'summary.json')

    if not os.path.exists(jsonl_path):
        print(f'Error: {jsonl_path} not found', file=sys.stderr)
        sys.exit(1)

    # Load summary if available
    summary_data = None
    if os.path.exists(summary_path):
        try:
            with open(summary_path) as f:
                summary_data = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass

    # Process
    event_lines = process_jsonl(jsonl_path, summary_data)

    # Build output
    output_parts = []
    if not args.no_frontmatter:
        output_parts.append(build_front_matter(jsonl_path, summary_data))
    output_parts.append('\n'.join(event_lines))
    output_parts.append(CLICK_TO_EXPAND_SCRIPT)

    result = '\n'.join(output_parts)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(result)
        print(f'Wrote {len(event_lines)} lines to {args.output}', file=sys.stderr)
    else:
        print(result)


if __name__ == '__main__':
    main()
