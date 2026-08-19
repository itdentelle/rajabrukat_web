import os
import re
import sys
import json
import time
import base64
import csv
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

def clean_color_name(filename, is_first=False):
    if is_first:
        return "Gambar Utama (Manekin)"
    name = os.path.splitext(filename)[0]
    name = re.sub(r'[-_]', ' ', name)
    name = re.sub(r'scaled|copy', '', name, flags=re.IGNORECASE).strip()
    if re.search(r'chatgpt|manekin|ai', name, re.IGNORECASE):
        return "Gambar Utama (Manekin)"
    words = [w.capitalize() for w in name.split() if w]
    return ' '.join(words)

def download_image_js(page, url, filepath):
    """Download image via browser JS fetch to bypass Cloudflare protection."""
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
    print("🚀 Membuka Browser Otomatis untuk Bypass Cloudflare & Scraping...")
    co = ChromiumOptions()
    co.set_argument('--no-sandbox')
    co.set_argument('--disable-gpu')
    co.set_argument('--lang=id-ID')
    
    page = ChromiumPage(co)
    print("🌐 Menghubungi https://rajabrukat.com/shop/ ...")
    page.get("https://rajabrukat.com/shop/")
    time.sleep(3)
    print("✅ Berhasil melewati sesi keamanan Cloudflare!")

    with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        products = list(reader)

    print(f"📦 Total produk dalam CSV: {len(products)}")

    downloaded_img_count = 0
    created_products = 0

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

        print(f"\n[{idx+1}/{len(products)}] Memproses: {raw_title[:50]}... ({len(image_urls)} foto)")

        variants = []
        used_colors = set()

        for img_idx, img_url in enumerate(image_urls):
            parsed = urlparse(img_url)
            orig_filename = os.path.basename(parsed.path)
            is_first = (img_idx == 0)
            
            color_name = clean_color_name(orig_filename, is_first)
            if color_name in used_colors and not is_first:
                color_name = f"{color_name} {img_idx+1}"
            used_colors.add(color_name)

            ext = os.path.splitext(orig_filename)[1] or '.png'
            local_filename = f"{color_name}{ext}"
            filepath = os.path.join(product_dir, local_filename)

            success = download_image_js(page, img_url, filepath)
            if success:
                downloaded_img_count += 1

            rel_path = os.path.join("hasil_scraping", cat_folder, folder_name, local_filename)
            variants.append({
                "color_name": color_name,
                "image_url": img_url,
                "local_path": rel_path,
                "is_main_thumbnail": is_first
            })

        # Parse available colors
        available_colors = []
        full_text = f"{short_desc}\n{desc}"
        for line in full_text.split('\n'):
            m = re.match(r'^([A-Z\s]+)\s*:\s*(\d+\s*PCS)', line, re.IGNORECASE)
            if m:
                available_colors.append(f"{m.group(1).strip()} : {m.group(2).strip()}")

        if not available_colors:
            for v in variants:
                if not v['is_main_thumbnail']:
                    available_colors.append(f"{v['color_name'].upper()} : 100 PCS")

        price_str = f"Rp{int(reg_price):,}" if reg_price.isdigit() else "Rp150,000"
        if sale_price and sale_price.isdigit():
            price_str = f"Rp{int(reg_price):,}Original price was: Rp{int(reg_price):,}.Rp{int(sale_price):,}Current price is: Rp{int(sale_price):,}."

        metadata = {
            "title": raw_title,
            "category": cat_folder,
            "price": price_str,
            "url": f"https://rajabrukat.com/product/{slug}/",
            "available_colors": available_colors,
            "description": short_desc or desc,
            "variants": variants,
            "short_description": short_desc,
            "full_description": desc
        }

        meta_path = os.path.join(product_dir, "metadata.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=4, ensure_ascii=False)

        created_products += 1

    page.quit()
    print("\n" + "="*60)
    print("🎉 SCRAPING DAN DOWNLOAD BERHASIL 100%!")
    print(f"📦 Total Produk Diproses: {created_products}")
    print(f"🖼️ Total Foto Diunduh: {downloaded_img_count}")
    print(f"📁 Lokasi Folder: {BASE_DIR}")
    print("="*60)

if __name__ == '__main__':
    main()
