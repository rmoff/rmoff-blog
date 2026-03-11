#!/usr/bin/env python3
"""
Extract Claude Code session logs into a single AsciiDoc chat log.

Usage:
    python scripts/extract_chat_log.py > chat_log.adoc
"""

import json
import sys
from pathlib import Path
from datetime import datetime

SESSIONS_DIR = Path.home() / ".claude/projects/-Users-rmoff-git-env-agency-dbt"


def parse_timestamp(ts_str):
    """Parse ISO timestamp to datetime."""
    if not ts_str:
        return None
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except:
        return None


def get_session_start_time(filepath):
    """Get the first timestamp from a session file."""
    with open(filepath) as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get("timestamp"):
                    return parse_timestamp(entry["timestamp"])
            except:
                continue
    return None


def extract_user_content(message):
    """Extract readable content from a user message."""
    content = message.get("content", "")

    if isinstance(content, str):
        text = content.strip()
        # Skip local command noise
        if "<local-command" in text or "<command-name>" in text:
            return ""
        return text

    if isinstance(content, list):
        parts = []
        for item in content:
            if item.get("type") == "text":
                text = item.get("text", "")
                # Skip local command noise
                if "<local-command" in text or "<command-name>" in text:
                    continue
                parts.append(text)
            elif item.get("type") == "tool_result":
                # Summarize tool results
                tool_content = item.get("content", [])
                if isinstance(tool_content, list):
                    for tc in tool_content:
                        if tc.get("type") == "text":
                            text = tc.get("text", "")
                            # Truncate long tool results
                            if len(text) > 500:
                                parts.append(f"[tool result: {text[:200]}...]")
                            elif text.strip():
                                parts.append(f"[tool result]")
                elif isinstance(tool_content, str):
                    parts.append("[tool result]")
        return "\n".join(parts).strip()

    return ""


def extract_assistant_content(message):
    """Extract text and thinking from assistant message."""
    content = message.get("content", [])

    text_parts = []
    thinking_parts = []
    tool_uses = []

    if not isinstance(content, list):
        return "", "", []

    for item in content:
        item_type = item.get("type", "")

        if item_type == "text":
            text = item.get("text", "").strip()
            if text:
                text_parts.append(text)

        elif item_type == "thinking":
            thinking = item.get("thinking", "").strip()
            if thinking:
                thinking_parts.append(thinking)

        elif item_type == "tool_use":
            tool_name = item.get("name", "unknown")
            tool_input = item.get("input", {})

            # Create readable summary of tool use
            if tool_name == "Read":
                path = tool_input.get("file_path", "")
                tool_uses.append(f"reads `{Path(path).name}`")
            elif tool_name == "Write":
                path = tool_input.get("file_path", "")
                tool_uses.append(f"writes `{Path(path).name}`")
            elif tool_name == "Edit":
                path = tool_input.get("file_path", "")
                tool_uses.append(f"edits `{Path(path).name}`")
            elif tool_name == "Bash":
                cmd = tool_input.get("command", "")
                if len(cmd) > 60:
                    cmd = cmd[:60] + "..."
                tool_uses.append(f"runs `{cmd}`")
            elif tool_name == "Glob":
                pattern = tool_input.get("pattern", "")
                tool_uses.append(f"searches for `{pattern}`")
            elif tool_name == "Grep":
                pattern = tool_input.get("pattern", "")
                tool_uses.append(f"greps for `{pattern}`")
            elif tool_name == "Task":
                desc = tool_input.get("description", "")
                tool_uses.append(f"launches agent: {desc}")
            elif tool_name == "WebFetch":
                url = tool_input.get("url", "")
                tool_uses.append(f"fetches {url[:50]}...")
            else:
                tool_uses.append(f"uses {tool_name}")

    return "\n\n".join(text_parts), "\n\n".join(thinking_parts), tool_uses


def escape_asciidoc(text):
    """Escape special AsciiDoc characters."""
    # Convert markdown-style bold/italic to AsciiDoc
    # **bold** -> *bold*
    # But be careful not to break things
    return text


def format_thinking_block(thinking):
    """Format thinking as a collapsible block."""
    if not thinking:
        return ""

    # Truncate very long thinking
    if len(thinking) > 2000:
        thinking = thinking[:2000] + "\n\n[... thinking truncated ...]"

    return f"""
[%collapsible]
.Claude's thinking
====
[.thinking]
{thinking}
====
"""


def format_tool_actions(tool_uses):
    """Format tool uses as an italicized action line."""
    if not tool_uses:
        return ""

    actions = ", ".join(tool_uses)
    return f"_Claude {actions}_\n\n"


def process_session(filepath):
    """Process a single session file and return formatted entries."""
    entries = []

    with open(filepath) as f:
        for line in f:
            try:
                entry = json.loads(line)
            except:
                continue

            entry_type = entry.get("type")

            if entry_type == "user":
                message = entry.get("message", {})
                content = extract_user_content(message)

                # Skip tool results that are just noise
                if content == "[tool result]" or not content:
                    continue

                # Skip if it's just a tool result marker
                if content.startswith("[tool result"):
                    continue

                entries.append({
                    "type": "user",
                    "content": content,
                    "timestamp": entry.get("timestamp")
                })

            elif entry_type == "assistant":
                message = entry.get("message", {})
                text, thinking, tool_uses = extract_assistant_content(message)

                # Skip empty responses (just tool calls with no text)
                if not text and not thinking:
                    if tool_uses:
                        entries.append({
                            "type": "action",
                            "tool_uses": tool_uses,
                            "timestamp": entry.get("timestamp")
                        })
                    continue

                entries.append({
                    "type": "assistant",
                    "content": text,
                    "thinking": thinking,
                    "tool_uses": tool_uses,
                    "timestamp": entry.get("timestamp")
                })

    return entries


def merge_consecutive_actions(entries):
    """Merge consecutive action entries."""
    merged = []

    for entry in entries:
        if entry["type"] == "action":
            # Check if previous entry was also an action
            if merged and merged[-1]["type"] == "action":
                merged[-1]["tool_uses"].extend(entry["tool_uses"])
                continue

        merged.append(entry)

    return merged


def format_session(session_num, start_time, entries):
    """Format a session as AsciiDoc."""
    output = []

    date_str = start_time.strftime("%B %d, %Y") if start_time else "Unknown date"
    output.append(f"== Session {session_num}: {date_str}\n")

    # Merge consecutive actions
    entries = merge_consecutive_actions(entries)

    for entry in entries:
        if entry["type"] == "user":
            output.append("[.human]")
            output.append("****")
            output.append(entry["content"])
            output.append("****\n")

        elif entry["type"] == "assistant":
            # Show thinking first if present
            if entry.get("thinking"):
                output.append(format_thinking_block(entry["thinking"]))

            # Show tool actions if any
            if entry.get("tool_uses"):
                output.append(format_tool_actions(entry["tool_uses"]))

            # Show response
            if entry.get("content"):
                output.append("[.assistant]")
                output.append("****")
                output.append(entry["content"])
                output.append("****\n")

        elif entry["type"] == "action":
            if entry.get("tool_uses"):
                output.append(format_tool_actions(entry["tool_uses"]))

    return "\n".join(output)


def main():
    # Find all session files
    session_files = list(SESSIONS_DIR.glob("*.jsonl"))

    # Get timestamps and sort
    sessions = []
    for f in session_files:
        start_time = get_session_start_time(f)
        if start_time:
            sessions.append((start_time, f))

    sessions.sort(key=lambda x: x[0])

    # Output header
    print("= Building a dbt Pipeline with Claude Code")
    print(":toc:")
    print(":toclevels: 2")
    print(":source-highlighter: highlight.js")
    print()
    print("This document captures the conversation between a human and Claude Code")
    print("while building a dbt pipeline for UK Environment Agency flood data.")
    print()

    # Process each session
    for i, (start_time, filepath) in enumerate(sessions, 1):
        entries = process_session(filepath)

        # Skip empty sessions
        if not entries:
            continue

        # Skip sessions with only actions and no real conversation
        real_entries = [e for e in entries if e["type"] in ("user", "assistant")]
        if not real_entries:
            continue

        formatted = format_session(i, start_time, entries)
        print(formatted)
        print()


if __name__ == "__main__":
    main()
