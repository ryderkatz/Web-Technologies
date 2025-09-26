from bs4 import BeautifulSoup
import csv, json, re

HTML_FILE = "THE NORBERT, West Bend - Restaurant Reviews, Photos & Phone Number - Tripadvisor.html" # downloaded Tripvisor html file
OUT_CSV   = "parsed.csv"
OUT_JSON  = "parsed.json"

def txt(el):
    return re.sub(r"\s+", " ", el.get_text(strip=True)) if el else ""

def bubbles_to_num(label):
    if not label: return ""
    m = re.search(r'([\d.]+)\s+of\s+5\s+bubbles', label, flags=re.I)
    return m.group(1) if m else ""

with open(HTML_FILE, "r", encoding="utf-8", errors="ignore") as f:
    soup = BeautifulSoup(f.read(), "lxml")

business_name = txt(soup.select_one('h1[data-test-target="top-info-header"]')) or txt(soup.select_one("h1"))
overall_rating = bubbles_to_num((soup.select_one('*[aria-label$=" of 5 bubbles"]') or {}).get("aria-label",""))

cards = soup.select('div[data-test-target="HR_CC_CARD"]')

rows = []
for c in cards:
    reviewer = txt(c.select_one('a[href*="/Profile/"]'))
    rating   = bubbles_to_num((c.select_one('*[aria-label$=" of 5 bubbles"]') or {}).get("aria-label",""))
    date     = txt(c.select_one('span[data-test-target="review-date"]'))
    date     = re.sub(r'^\s*Reviewed\s*', '', date, flags=re.I)
    text     = txt(c.select_one('q[data-test-target="review-text"]') or c.select_one('span[data-test-target="review-text"]'))
    if reviewer or text:
        rows.append({
            "business_name": business_name,
            "overall_rating": overall_rating,
            "reviewer": reviewer,
            "rating": rating,
            "date": date,
            "text": text
        })

fieldnames = ["business_name","overall_rating","reviewer","rating","date","text"]

with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    for r in rows:
        w.writerow(r)

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)

print(f"wrote {len(rows)} reviews to {OUT_CSV} and {OUT_JSON}")