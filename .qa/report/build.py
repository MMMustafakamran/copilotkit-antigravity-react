"""Build one framework's paste-friendly status HTML from per-repo assignment.json files.

Usage: python build.py <assignment.json>... --out file.html

Plain tables, inline styles, no classes/<th>/JS, so it pastes cleanly into the team Google Doc.
Framework-level settings (h1, title, style, quickstart table) come from the first assignment.
Pages with reachable "none" or an "excluded" reason are left out.
"""
import argparse, html, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import load, validate, page_url, visible

TD = 'border:1px solid #000;padding:6px 8px;vertical-align:top'
TABLE = 'border-collapse:collapse;margin-bottom:24px;width:100%'
STATUS_WORDS = {'✅': 'Working', '⚠️': 'Partially working', '❌': 'Not working'}
PY_ONLY = 'The code is written only in Python.'
warnings = []


FRESH_ONLY = None  # report date (YYYY-MM-DD) when --fresh-only is given


def esc(s):
    return html.escape(s.replace('`', ''))   # notes may carry `code` marks; the doc gets plain text


def href(l):
    return l['loom'] or '#LOOM-' + l['clip']


def td(v, extra=''):
    return f'<td style="{TD}{extra}">{v}</td>'


def row(cells):
    return '<tr>' + ''.join(cells) + '</tr>'


# ------------------------------------------------------------------ result cells
def team_cell(a, p):
    links = p.get('links', [])
    if any(not l.get('clip') for l in links):
        warnings.append(f"{a['repo']}: {p['id']}: clip not recorded yet, result cell left empty")
        return ''
    st = p['status']
    if st == 'python-only':
        return PY_ONLY
    out = [st] if st else []
    for l in links:
        text = l.get('text') or (f"{p['label']} - {a['report'].get('linkSuffix', 'JS')}" if st == '✅' else 'Issue')
        out.append(f'<a href="{href(l)}">{esc(text)}</a>')
    out += [esc(n) for n in p.get('notes', [])]
    b = p.get('block')
    if b:
        tc = a.get('testedContext', {})
        vers = ', '.join(f'“{k}”: “{v}”' for k, v in a.get('versions', {}).items() if k.startswith('@copilotkit/'))
        out += ['Area/Surface: ' + esc(b['area']), 'Problem: ' + esc(b['problem']), 'Tested context:',
                'OS: ' + esc(tc.get('os', '')), 'Package Manager and version: ' + esc(tc.get('packageManager', '')),
                vers, 'Loom Video ' + (f'<a href="{href(links[0])}">Loom</a>' if b.get('loomInBlock') and links else '')]
    return '<br>'.join(out)


def status_cell(a, p):
    st = p['status']
    if st == 'python-only':
        return PY_ONLY
    links = p.get('links', [])
    head = st + (' ' + STATUS_WORDS[st] if st in STATUS_WORDS else '')
    if links and links[0].get('clip') is None and not links[0].get('loom'):
        warnings.append(f"{a['repo']}: {p['id']}: clip not recorded yet")
        links = []
    # status style: the link text is always the status label (emoji + word), never a per-clip text
    first = [f'<a href="{href(l)}">{esc(head)}</a>' for l in links] or [esc(head)]
    notes = [f'<span style="font-size:9pt">{esc(n)}</span>' for n in p.get('notes', [])]
    return '<br>'.join(first + notes)


def cell(a, p):
    # Owner, 2026-11-18: guide rows are no longer marked "❌ Blocked" when the quickstart is blocked
    # (old QA-RULES 8b). Each page shows its own result; the quickstart problem is reported once, on the
    # quickstart row. A page never built (notTested) just says so.
    if p.get('kind', 'guide') == 'guide' and p.get('notTested'):
        return '<br>'.join(['–', esc('Not tested: the quickstart gives no setup to build on.')])
    return (team_cell if a['report']['style'] == 'team' else status_cell)(a, p)



def label_cell(a, p):
    text = ('- ' if p.get('child') else '') + p['label']
    u = page_url(a, p)
    return f'<a href="{html.escape(u)}">{esc(text)}</a>' if u else esc(text)


# ------------------------------------------------------------------ tables
SIDEBARS = {}  # id(assignment) -> parsed doc-snapshot/sidebar.json of that repo


def group_row(label, cols):
    return row([td(f'<b>{esc(label)}</b>').replace('<td ', f'<td colspan="{len(cols)}" ', 1)])


def sidebar_rows(a, pages, sb, cols, rc, center):
    """Rows in docs-sidebar order (doc-snapshot/sidebar-order.json from tools/sidebar_order.mjs):
    a bold group row for each section heading / folder when it is entered (not repeated when a
    page comes back up a level, e.g. Frontend-tools after the Threads folder), '- ' prefix for
    pages inside a folder (group path of 2+). Pages not in the sidebar go last."""
    root = '/' + sb['root'].strip('/')
    order, gpath, sbname = {}, {}, {}
    for i, sp in enumerate(sb['pages']):
        path = sp['url'].split('?')[0].rstrip('/')
        doc = path[len(root):].strip('/') if path.startswith(root) else path.strip('/')
        order.setdefault(doc, i)
        sbname.setdefault(doc, sp.get('name'))
        g = sp.get('group') or []
        g = g if isinstance(g, list) else g.split('>')  # sidebar-order.json: list; sidebar.json: "A > B"
        gpath.setdefault(doc, [x.strip() for x in g if x and x.strip()])
    norm = lambda d: (d or '').split('?')[0].strip('/')
    ranked = sorted(enumerate(pages), key=lambda t: (order.get(norm(t[1].get('docPath')), 10**6), t[0]))
    out, cur, tail, last = [], [], False, None
    for _, p in ranked:
        d = norm(p.get('docPath'))
        parts = gpath.get(d)
        if parts is None:
            if not tail:
                warnings.append(f"{a['repo']}: not in the docs sidebar, listed last: " +
                                ', '.join(q.get('id', '?') for q in pages if norm(q.get('docPath')) not in order))
                out.append(group_row('Other pages', cols)); tail = True
            parts = ['Other pages']
        c = 0
        while c < min(len(cur), len(parts)) and cur[c] == parts[c]:
            c += 1
        if not tail:
            for n in range(max(c, 0), len(parts)):
                if n == c and parts[n] == last:
                    continue  # folder labelled by its own page (e.g. Components and surfaces): that page row heads it
                out.append(group_row(parts[n], cols))
        cur, last = list(parts), sbname.get(d)
        q = dict(p, child=len(parts) >= 2 and not tail)
        vals = [''] * len(cols)
        vals[0], vals[rc] = label_cell(a, q), cell(a, q)
        out.append(row(td(v, ';width:30%' if i == 0 else (center if i == rc else '')) for i, v in enumerate(vals)))
    return out


def guides_table(a):
    r, cols = a['report'], a['report']['columns']
    status = r['style'] == 'status'
    rc = r.get('resultColumn', len(cols) - 1)
    center = ';text-align:center' if status else ''
    out = [f'<table style="{TABLE}">', row(td(f'<b>{esc(c)}</b>', center if status else '') for c in cols)]
    pages = [p for p in a['pages'] if p.get('kind', 'guide') == 'guide' and visible(p)]

    sb = SIDEBARS.get(id(a))
    if sb:  # owner 2026-11-23: rows follow the live docs sidebar order (doc-snapshot/sidebar-order.json)
        out += sidebar_rows(a, pages, sb, cols, rc, center)
        out.append('</table>')
        return out

    def page_rows(group):
        for p in pages:
            if p.get('group') == group:
                vals = [''] * len(cols)
                vals[0], vals[rc] = label_cell(a, p), cell(a, p)
                out.append(row(td(v, ';width:30%' if i == 0 else (center if i == rc else '')) for i, v in enumerate(vals)))

    page_rows(None)
    for s in a['sections']:
        # owner 2026-11-23: grouping rows are one bold label across the whole row; no "Section" /
        # "Sub section" cells (they made an extra narrow column in the Google Doc). s['cells'] is ignored.
        out.append(row([td(f'<b>{esc(s["label"])}</b>').replace('<td ', f'<td colspan="{len(cols)}" ', 1)]))
        page_rows(s['label'])
    out.append('</table>')
    return out


def quickstart_table(assignments):
    r0 = assignments[0]['report']
    status = r0['style'] == 'status'
    center = ';text-align:center' if status else ''
    out = [f'<table style="{TABLE}">']
    if r0.get('quickstartHeader'):
        out.append(row(td(f'<b>{esc(c)}</b>', ';text-align:center') for c in r0['quickstartHeader']))
    for a in assignments:
        for p in a['pages']:
            if p.get('kind') == 'quickstart' and visible(p):
                out.append(row([td(label_cell(a, p), ';width:30%'), td(cell(a, p), center)]))
    out.append('</table>')
    return out


def build(assignments):
    r0 = assignments[0]['report']
    for a in assignments[1:]:
        for k in ('style', 'h1', 'title'):
            if a['report'].get(k) != r0.get(k):
                warnings.append(f"{a['repo']}: report.{k} differs from the first assignment; using the first")
    h = ['<!doctype html>', f'<html><head><meta charset="utf-8"><title>{esc(r0["title"])}</title></head>',
         '<body style="font-family:Arial,sans-serif;font-size:11pt;max-width:1100px;margin:16px auto;padding:0 16px">',
         f'<h1>{esc(r0["h1"])}</h1>', f'<h2>{esc(r0.get("quickstartHeading", "Quickstarts"))}</h2>']
    h += quickstart_table(assignments)
    for a in assignments:
        if any(p.get('kind', 'guide') == 'guide' and visible(p) for p in a['pages']) or a['sections']:
            h.append(f'<h2>{esc(a["report"]["guidesHeading"])}</h2>')
            h += guides_table(a)
    if r0.get('clipsToUpload'):
        body = '\n'.join(h)
        used = sorted(set(re.findall(r'#LOOM-([\w-]+)', body)))
    if r0.get('clipsToUpload') and used:  # every clip on Loom: no empty "Clips to upload" section
        h += ['<h2>Clips to upload</h2>',
              '<p>Each link above points at #LOOM-&lt;clip&gt;. Replace it with the Loom URL of that clip '
              '(approved clips are in 3-output/&lt;date&gt;/deliver/).</p>',
              f'<table style="{TABLE}">', row([td('<b>Clip</b>'), td('<b>Placeholder</b>')])]
        h += [row([td(c + '.*'), td('#LOOM-' + c)]) for c in used]
        h.append('</table>')
    h.append('</body></html>')
    return '\n'.join(h)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('assignments', nargs='+')
    ap.add_argument('--out', required=True)
    ap.add_argument('--fresh-only', metavar='DATE', help='blocked-quickstart guide rows not filmed on DATE: no clip, "not retested"')
    args = ap.parse_args()
    global FRESH_ONLY
    FRESH_ONLY = args.fresh_only
    assignments = [load(p) for p in args.assignments]
    for p, a in zip(args.assignments, assignments):
        snap = os.path.join(os.path.dirname(os.path.abspath(p)), 'doc-snapshot')
        for name in ('sidebar-order.json', 'sidebar.json'):  # crawled visual order first, drift baseline second
            if os.path.exists(os.path.join(snap, name)):
                SIDEBARS[id(a)] = load(os.path.join(snap, name))
                if name == 'sidebar.json':
                    warnings.append(f'{p}: no doc-snapshot/sidebar-order.json, using sidebar.json (order/groups may be off)')
                break
        else:
            warnings.append(f'{p}: no doc-snapshot/sidebar-order.json or sidebar.json next to it, rows keep assignment order')
    errs = [e for p, a in zip(args.assignments, assignments) for e in validate(a, p)]
    if errs:
        sys.exit('invalid assignment:\n  ' + '\n  '.join(errs))
    doc = build(assignments)
    with open(args.out, 'w', encoding='utf8', newline='\n') as f:
        f.write(doc)
    rows = sum(1 for a in assignments for p in a['pages'] if visible(p))
    placeholders = len(set(re.findall(r'#LOOM-([\w-]+)"', doc)))
    print(f'wrote {args.out}: {rows} page rows, {placeholders} clips without a Loom URL')
    for w in warnings:
        print('  warn:', w)


if __name__ == '__main__':
    main()
