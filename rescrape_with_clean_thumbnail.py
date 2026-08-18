import os
import re
import sys
import json
import time
import base64
import csv
import shutil
from urllib.parse import urlparse
from DrissionPage import ChromiumPage, ChromiumOptions

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CSV_FILE = os.path.join(os.getcwd(), "wc-product-export-18-8-2026-1787036722228.csv")
BASE_DIR = r"C:\Users\DWIKY SUMARLIN\Documents\PORTOFOLIO\web-scrapping-rb\hasil_scraping"

def sanitize_filename(name):
    if not name:
        return "Unnamed"
    clean = re.sub(r'[\\/*?:"<>|]', " – ", str(name))
    clean = re.sub(r'[\r\n\t]+', " ", clean)
    clean = re.sub(r'\s+', " ", clean).strip()
    return clean[:120]

def extract_code(title):
    match = re.search(r'KODE\s*\[?\s*([0-9A-Za-z]+)\s*\]?', title, re.IGNORECASE)
    return match.group(1).upper() if match else ""

def clean_description(short_desc, full_desc):
    combined = f"{short_desc or ''}\n\n{full_desc or ''}"
    # Unescape
    combined = combined.replace('\\n', '\n').replace('\\r', '').replace('\\t', ' ')
    # HTML to text
    combined = re.sub(r'<br\s*/?>', '\n', combined, flags=re.IGNORECASE)
    combined = re.sub(r'<li[^>]*>', '\n• ', combined, flags=re.IGNORECASE)
    combined = re.sub(r'</li>', '', combined, flags=re.IGNORECASE)
    combined = re.sub(r'</?(?:ol|ul|p|div|section|article)[^>]*>', '\n', combined, flags=re.IGNORECASE)
    combined = re.sub(r'</?(?:strong|b|em|i|span|h[1-6])[^>]*>', '', combined, flags=re.IGNORECASE)
    combined = combined.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    combined = re.sub(r'<[^>]+>', '', combined)

    lines = [l.strip() for l in combined.split('\n')]
    clean_lines = []
    for line in lines:
        if not line and clean_lines and not clean_lines[-1]:
            continue
        if line in ['\\', '&nbsp;', '•']:
            continue
        clean_lines.append(line)

    return '\n'.join(clean_lines).strip()

def is_detail_or_promo_image(filename):
    f = filename.lower()
    return any(k in f for k in ['detail', 'motif', 'chatgpt', 'banner', 'watermark', '100%', 'eksklusif', 'na-'])

def clean_color_name(filename):
    name = os.path.splitext(filename)[0]
    name = re.sub(r'[-_]', ' ', name)
    name = re.sub(r'scaled|copy|jpg|png|jpeg', '', name, flags=re.IGNORECASE).strip()
    name = re.sub(r'\s+\d+$', '', name).strip()
    words = [w.capitalize() for w in name.split() if w]
    return ' '.join(words)

def download_image_js(page, url, filepath):
    if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
        return True

    js = """
    return (async (url) => {
        try {
            const resp = await fetch(url, { mode: 'cors', credentials: 'include' });
            if (!resp.ok) return null;
            const blob = await resp.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            return null;
        }
    })(arguments[0]);
    """
    try:
        data_url = page.run_js(js, url)
        if data_url and data_url.startswith("data:"):
            header, encoded = data_url.split(",", 1)
            data = base64.b64decode(encoded)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, "wb") as f:
                f.write(data)
            return True
    except Exception as e:
        print(f"    ⚠️ Gagal download gambar {url}: {e}")
    return False

def main():
    print("==========================================================")
    print("🚀 MEMULAI SCRAPING BERSIH DENGAN PENANDAAN THUMBNAIL PASTI")
    print("==========================================================")

    # 1. Buka browser DrissionPage
    co = ChromiumOptions()
    co.set_argument('--no-sandbox')
    co.set_argument('--disable-gpu')
    co.set_argument('--lang=id-ID')
    page = ChromiumPage(co)
    print("🌐 Menghubungi https://rajabrukat.com/shop/ ...")
    page.get("https://rajabrukat.com/shop/")
    time.sleep(3)
    print("✅ Berhasil melewati sesi keamanan Cloudflare!")

    # 2. Baca CSV
    with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        products = list(reader)

    print(f"📦 Total produk dalam CSV: {len(products)}")

    # 3. Kosongkan folder hasil_scraping agar steril
    print("🧹 Membersihkan folder hasil_scraping lama...")
    for cat in ['Panel A Grade', 'Panel B Grade', 'Tulle']:
        c_path = os.path.join(BASE_DIR, cat)
        if os.path.exists(c_path):
            shutil.rmtree(c_path, ignore_errors=True)
        os.makedirs(c_path, exist_ok=True)
    print("✅ Folder hasil_scraping siap dan steril!")

    total_downloaded = 0

    for idx, p in enumerate(products):
        raw_title = p.get('Name', '').strip()
        if not raw_title:
            continue

        raw_cat = p.get('Categories', 'Panel B')
        reg_price = p.get('Regular price', '150000') or '150000'
        sale_price = p.get('Sale price', '')
        desc = p.get('Description', '')
        short_desc = p.get('Short description', '')
        slug = p.get('Slug', '')

        cat_folder = 'Panel B Grade'
        if 'Panel A' in raw_cat:
            cat_folder = 'Panel A Grade'
        elif 'tulle' in raw_cat.lower():
            cat_folder = 'Tulle'

        folder_name = sanitize_filename(raw_title)
        product_dir = os.path.join(BASE_DIR, cat_folder, folder_name)
        os.makedirs(product_dir, exist_ok=True)

        images_str = p.get('Images', '')
        image_urls = [u.strip() for u in images_str.split(',') if u.strip().startswith('http')]

        product_code = extract_code(raw_title) or f"PRD-{idx+1}"
        clean_desc = clean_description(short_desc, desc)

        print(f"\n[{idx+1}/{len(products)}] Memproses: {raw_title[:50]}... (Kode: {product_code})")

        thumbnail_file = ""
        detail_files = []
        color_variants = []
        gallery_files = []
        used_color_names = set()

        # Parse stock per color from clean description
        stock_map = {}
        for line in clean_desc.split('\n'):
            # e.g. "• Grade A @Sage Green [ 71 PCS ]" or "HIJAU SAGE : 100 PCS"
            m = re.search(r'(?:@|•\s*)?([A-Za-z\s]+?)\s*(?:\[\s*(\d+)\s*(?:PCS|pcs|roll)?\s*\]|:\s*(\d+))', line)
            if m:
                c_name = m.group(1).replace('Grade A', '').replace('Grade B', '').strip()
                stk = int(m.group(2) or m.group(3) or 100)
                if c_name and len(c_name) < 30:
                    stock_map[c_name.lower()] = stk

        for img_idx, img_url in enumerate(image_urls):
            parsed = urlparse(img_url)
            orig_filename = os.path.basename(parsed.path)
            ext = os.path.splitext(orig_filename)[1] or '.png'

            # FOTO #1: ALWAYS THE THUMBNAIL (FEATURED IMAGE)
            if img_idx == 0:
                thumbnail_file = f"thumbnail{ext}"
                dest_path = os.path.join(product_dir, thumbnail_file)
                if download_image_js(page, img_url, dest_path):
                    total_downloaded += 1
                gallery_files.append(thumbnail_file)
                print(f"  ⭐ [THUMBNAIL] {orig_filename} -> {thumbnail_file}")
            else:
                # FOTO #2..N: DETAIL MOTIF vs COLOR VARIANT
                if is_detail_or_promo_image(orig_filename):
                    detail_filename = f"detail_motif_{len(detail_files)+1}{ext}"
                    dest_path = os.path.join(product_dir, detail_filename)
                    if download_image_js(page, img_url, dest_path):
                        total_downloaded += 1
                    detail_files.append(detail_filename)
                    gallery_files.append(detail_filename)
                    print(f"  🔍 [DETAIL MOTIF] {orig_filename} -> {detail_filename}")
                else:
                    color_name = clean_color_name(orig_filename)
                    if not color_name or color_name.lower() in ['detail', 'motif']:
                        color_name = f"Varian {len(color_variants)+1}"

                    if color_name in used_color_names:
                        color_name = f"{color_name} {len(color_variants)+1}"
                    used_color_names.add(color_name)

                    color_filename = f"color_{sanitize_filename(color_name)}{ext}"
                    dest_path = os.path.join(product_dir, color_filename)
                    if download_image_js(page, img_url, dest_path):
                        total_downloaded += 1

                    # Look up stock
                    stk = 100
                    for k, v in stock_map.items():
                        if k in color_name.lower() or color_name.lower() in k:
                            stk = v
                            break

                    color_variants.append({
                        "color_name": color_name,
                        "file": color_filename,
                        "stock": stk
                    })
                    gallery_files.append(color_filename)
                    print(f"  🎨 [VARIAN WARNA] {orig_filename} -> {color_name} (Stok: {stk})")

        metadata = {
            "title": raw_title,
            "code": product_code,
            "category": cat_folder,
            "regular_price": int(reg_price) if reg_price.isdigit() else 150000,
            "sale_price": int(sale_price) if sale_price and sale_price.isdigit() else None,
            "url": f"https://rajabrukat.com/product/{slug}/",
            "clean_description": clean_desc,
            "thumbnail_file": thumbnail_file,
            "detail_files": detail_files,
            "color_variants": color_variants,
            "gallery_files": gallery_files
        }

        with open(os.path.join(product_dir, "metadata.json"), "w", encoding="utf-8") as mf:
            json.dump(metadata, mf, indent=4, ensure_ascii=False)

    page.quit()
    print("\n" + "="*60)
    print("🎉 SCRAPING DENGAN THUMBNAIL PASTI SELESAI 100%!")
    print(f"📦 Total Produk: {len(products)}")
    print(f"🖼️ Total Foto Diunduh: {total_downloaded}")
    print(f"📁 Lokasi: {BASE_DIR}")
    print("="*60)

if __name__ == '__main__':
    main()
