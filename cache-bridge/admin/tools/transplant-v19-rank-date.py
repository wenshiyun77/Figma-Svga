#!/usr/bin/env python3
"""Change only the ranking user's small secondary line from ID to login date.

Usage: python cache-bridge/admin/tools/transplant-v19-rank-date.py [ui.html]
This expects the v18 admin renderer and preserves all other code and styles.
"""
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[3]
target = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / 'src/ui.html'
source = target.read_text()
before = 'id.textContent=String(user.figmaUserId||"");'
after = 'id.textContent=(user.lastLoginAt||user.lastOpenedAt)?formatAdminBeijingDateTime(user.lastLoginAt||user.lastOpenedAt).slice(0,16):"—";'
start = source.index('      const renderAdminStatistics =')
end = source.index('      const loadAdminStatistics =', start)
block = source[start:end]
if after in block:
    print(f'Already applied: {target}')
    raise SystemExit(0)
if block.count(before) != 1:
    raise RuntimeError('Expected exactly one ranking-name ID small-line anchor')
source = source[:start] + block.replace(before, after, 1) + source[end:]
target.write_text(source)
print(f'Changed only the ranking name secondary line to YYYY/MM/DD HH:mm Beijing login/open time: {target}')
