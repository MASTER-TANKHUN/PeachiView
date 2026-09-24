"""Refresh the static channel snapshot used by the site.

Reads the public YouTube channel pages (no API key needed) and writes:
  src/data/channel.json  – name, handle, stats, description, links
  src/data/videos.json   – every upload / live / short with date, views, category, model era

Usage:  python scripts/fetch_channel.py
The site also refreshes the newest uploads at runtime through /api/latest.
"""
from __future__ import annotations

import json
import re
import time
import urllib.request
from datetime import datetime
from pathlib import Path

HANDLE = "@PeachiView249"
CHANNEL_ID = "UCEk6QSUJhVf56A_VznMpKpg"
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"

PLAYLISTS = {
    "horror": ["PLXRFVACmpkatTj5cIiqySezzOai0ZVMuT", "PLXRFVACmpkatgcjwmfHTxxUBkQPZQCZIq"],
    "roblox": ["PLXRFVACmpkasLde4AfmiJZDzUahYUjitg"],
    "minecraft": ["PLXRFVACmpkavoCKlZU3mffwtv5ACGdvXz", "PLXRFVACmpkasxG-9spATx4lGSnNczdu-m"],
    "reality": ["PLXRFVACmpkasZlgiN3QwkMyiYnKoRmGX0"],
    "music": ["PLXRFVACmpkatAlAtf9kliX9xSb9aA1KHh", "PLXRFVACmpkauc1gGoi3xkaqKyD9Jwwd9R"],
    "live": ["PLXRFVACmpkauH_gY5-7_z4YJEUafyxftA"],
    "games": ["PLXRFVACmpkatxDn2okMmBsFCfWhbvSZbj"],
}
KEYWORDS = {
    "horror": r"ผี|สยองขวัญ|horror|scary|poppy|baby in yellow|santa|death trips|timore|red riding|open house|siren|mad father|far away|virus zombie|i am lost|foc/us|ประตู|หยุดโต|ชายแปลกหน้า|ชายคนนี้|hospital|สัตว์ประหลาด|thalassophobia|two sentence|น่ากลัว",
    "roblox": r"roblox|โรบล็อก|ขายอาหาร",
    "minecraft": r"minecraft|มายคราฟ",
    "reality": r"reality",
    "music": r"mmd|cover|ร้องเพลง",
    "games": r"identity v|telekinesis|crash world|happiness project|you left me|wonderland|popcat|gameplay|game|เกม",
}
# Model eras (see the "Models" section): pink tee → pink hoodie → 2026 comeback art
ERAS = [("v1", "2021-01-01", "2021-09-23"), ("v2", "2021-09-24", "2022-12-31"), ("v3", "2026-01-01", "2099-12-31")]


def get(url: str, data: bytes | None = None) -> str:
    headers = {"User-Agent": UA, "Accept-Language": "en"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def initial_data(html: str) -> dict:
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html, re.S)
    if m:
        return json.loads(m.group(1))
    m = re.search(r'<script[^>]*id="yt-initial-data"[^>]*>(.*?)</script>', html, re.S)
    if m:
        return json.loads(m.group(1))
    raise ValueError("ytInitialData not found")


def walk(o, key):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == key:
                yield v
            yield from walk(v, key)
    elif isinstance(o, list):
        for v in o:
            yield from walk(v, key)


class Innertube:
    def __init__(self, html: str):
        self.key = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html).group(1)
        self.ver = re.search(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', html).group(1)

    def call(self, endpoint: str, payload: dict) -> dict:
        body = {"context": {"client": {"clientName": "WEB", "clientVersion": self.ver, "hl": "en", "gl": "TH"}}, **payload}
        url = f"https://www.youtube.com/youtubei/v1/{endpoint}?key={self.key}&prettyPrint=false"
        return json.loads(get(url, json.dumps(body).encode()))


def lockups(d: dict) -> list[dict]:
    out = []
    for v in walk(d, "lockupViewModel"):
        if not v.get("contentId"):
            continue
        title = v.get("metadata", {}).get("lockupMetadataViewModel", {}).get("title", {}).get("content", "")
        badges = [b.get("text") for b in walk(v.get("contentImage", {}), "thumbnailBadgeViewModel")]
        out.append({"id": v["contentId"], "title": title, "length": badges[0] if badges else ""})
    return out


def shorts(d: dict) -> list[dict]:
    out = []
    for v in walk(d, "shortsLockupViewModel"):
        vid = re.search(r'"videoId":\s*"([^"]+)"', json.dumps(v))
        title = v.get("overlayMetadata", {}).get("primaryText", {}).get("content", "")
        if vid:
            out.append({"id": vid.group(1), "title": title, "length": ""})
    return out


def tab(it: Innertube | None, name: str, parse) -> tuple[list[dict], Innertube]:
    html = get(f"https://www.youtube.com/{HANDLE}/{name}")
    it = it or Innertube(html)
    d = initial_data(html)
    items = parse(d)
    seen = {i["id"] for i in items}
    token = None
    for grid in walk(d, "richGridRenderer"):  # the grid's last item holds the "load more" token
        for c in walk(grid.get("contents", [])[-1:], "continuationCommand"):
            token = c["token"]
    while token:
        r = it.call("browse", {"continuation": token})
        new = [i for i in parse(r) if i["id"] not in seen]
        if not new:
            break
        items += new
        seen.update(i["id"] for i in new)
        token = None
        for a in r.get("onResponseReceivedActions", []):
            for c in walk(a, "continuationCommand"):
                token = c["token"]
    return items, it


def has_maxres(video_id: str) -> bool:
    """maxresdefault only exists for HD uploads; otherwise YouTube answers 404."""
    req = urllib.request.Request(f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg", method="HEAD", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status == 200
    except Exception:
        return False


def parse_date(s: str) -> str:
    s = re.sub(r"^(Premiered|Streamed live on|Started streaming on)\s+", "", s or "")
    return datetime.strptime(s, "%b %d, %Y").strftime("%Y-%m-%d")


def main() -> None:
    videos, it = tab(None, "videos", lockups)
    lives, _ = tab(it, "streams", lockups)
    shorts_, _ = tab(it, "shorts", shorts)
    kinds = [(v, "video") for v in videos] + [(v, "live") for v in lives] + [(v, "short") for v in shorts_]

    membership: dict[str, set[str]] = {}
    for cat, pids in PLAYLISTS.items():
        for pid in pids:
            d = it.call("browse", {"browseId": "VL" + pid})
            ids = [v.get("videoId") for v in walk(d, "playlistVideoRenderer")] + [v.get("contentId") for v in walk(d, "lockupViewModel")]
            for vid in filter(None, ids):
                membership.setdefault(vid, set()).add(cat)
            time.sleep(0.3)

    rows = []
    for v, kind in kinds:
        d = it.call("next", {"videoId": v["id"]})
        s = json.dumps(d, ensure_ascii=False)
        date = re.search(r'"dateText":\s*\{"simpleText":\s*"([^"]+)"', s)
        views = re.search(r'"videoViewCountRenderer":\s*\{"viewCount":\s*\{"simpleText":\s*"([\d,]+)', s)
        cats = set(membership.get(v["id"], set()))
        for cat, rx in KEYWORDS.items():
            if re.search(rx, v["title"], re.I):
                cats.add(cat)
        if kind == "live":
            cats.add("live")
        if not cats:
            cats.add("talk")
        iso = parse_date(date.group(1)) if date else ""
        era = next((e for e, a, b in ERAS if a <= iso <= b), "v3")
        rows.append({
            "id": v["id"], "title": v["title"], "date": iso, "kind": kind,
            "views": int(views.group(1).replace(",", "")) if views else 0,
            "length": v["length"], "cats": sorted(cats), "era": era,
            "hd": has_maxres(v["id"]),
        })
        print(kind, iso, v["id"], v["title"][:50])
        time.sleep(0.4)
    rows.sort(key=lambda r: r["date"], reverse=True)
    (DATA / "videos.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    about = initial_data(get(f"https://www.youtube.com/{HANDLE}/about"))
    a = next(walk(about, "aboutChannelViewModel"), {})
    head = initial_data(get(f"https://www.youtube.com/{HANDLE}"))
    md = head.get("metadata", {}).get("channelMetadataRenderer", {})
    channel = {
        "id": CHANNEL_ID,
        "handle": HANDLE,
        "title": md.get("title", "PeachiView"),
        "description": a.get("description", md.get("description", "")),
        "subscribers": a.get("subscriberCountText", ""),
        "views": a.get("viewCountText", ""),
        "videos": a.get("videoCountText", ""),
        "joined": (a.get("joinedDateText") or {}).get("content", ""),
        "fetchedAt": datetime.utcnow().strftime("%Y-%m-%d"),
    }
    (DATA / "channel.json").write_text(json.dumps(channel, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {len(rows)} videos")


if __name__ == "__main__":
    main()
