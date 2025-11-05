import os
import sys
from time import sleep
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from dotenv import load_dotenv
import pyautogui # 👈 Import PyAutoGUI

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
USERNAME = os.getenv('PROMED_USERNAME')
PASSWORD = os.getenv('PROMED_PASSWORD')
SEARCH_QUERY = 'dengue'
DATE_FROM = '2025-01-01'
DATE_TO = '2025-09-26'

# User-provided coordinates for PyAutoGUI clicks
# NOTE: These are ABSOLUTE SCREEN coordinates and are HIGHLY UNRELIABLE.
# They are only used here as requested.
COORDINATE_1_X = 354
COORDINATE_1_Y = 1015
COORDINATE_2_X = 22
COORDINATE_2_Y = 515
DELAY_BETWEEN_CLICKS = 2
# ---------------------

def fetch_promed_outbreaks():
    """
    Automates login, search, filtering for 'dengue' using PyAutoGUI coordinate 
    clicks as the only means of filter interaction, then scrapes the table.
    """
    print("⏳ Starting browser...")

    options = webdriver.ChromeOptions()
    options.add_argument('--start-maximized')
    options.add_argument('--no-sandbox')

    try:
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 30)
        outbreaks = []

        # --- LOGIN & NAVIGATION ---
        print("➡️ Logging in...")
        driver.get('https://www.promedmail.org/auth/login')
        wait.until(EC.presence_of_element_located((By.ID, 'username'))).send_keys(USERNAME)
        driver.find_element(By.ID, 'password').send_keys(PASSWORD)
        driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
        wait.until(EC.url_to_be('https://www.promedmail.org/'))
        print('✅ Logged in successfully')

        # --- SEARCH ---
        search_url = f'https://www.promedmail.org/search/?q={SEARCH_QUERY}&date={DATE_FROM}..{DATE_TO}'
        driver.get(search_url)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, 'table')))

        # --- OPEN LOCATION FILTER ---
        location_filter_button_selector = '#radix-\u00abrh\u00bb'
        wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, location_filter_button_selector))).click()
        print('✅ Location filter opened')
        
        # --- TYPE 'INDIA' ---
        location_input_selector = '.pb-4 > div:nth-child(1) > div:nth-child(2) > input'
        location_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, location_input_selector)))
        print('➡️ Typing "India" in location search...')
        location_input.send_keys('India')
        
        # Give the results a moment to appear
        sleep(5) 
        
        # ----------------------------------------------
        # --- PERFORM TWO PYAUTOGUI COORDINATE CLICKS ---
        # ----------------------------------------------
        
        print(f"🖱️ Clicking first coordinate: ({COORDINATE_1_X}, {COORDINATE_1_Y})")
        try:
            pyautogui.click(COORDINATE_1_X, COORDINATE_1_Y)
            
            # Wait for the specified delay
            print(f"⏳ Waiting for {DELAY_BETWEEN_CLICKS} seconds...")
            sleep(DELAY_BETWEEN_CLICKS)
            
            print(f"🖱️ Clicking second coordinate: ({COORDINATE_2_X}, {COORDINATE_2_Y})")
            pyautogui.click(COORDINATE_2_X, COORDINATE_2_Y)
            
            print('✅ Both coordinate clicks performed.')
            
        except Exception as e:
            print(f"❌ PyAutoGUI click failed. Ensure the browser window is visible and maximized: {e}")
            return []
        
        # Wait for filtering to apply
        sleep(3) 

        # --- SCRAPE TABLE ---
        print('➡️ Scraping table data...')
        
        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'table tbody tr')))
        
        rows = driver.find_elements(By.CSS_SELECTOR, 'table tbody tr')
        
        for row in rows:
            cells = row.find_elements(By.TAG_NAME, 'td')
            if len(cells) >= 8:
                outbreaks.append({
                    'alertId': cells[0].text.strip(),
                    'date': cells[1].text.strip(),
                    'title': cells[2].text.strip(),
                    'region': cells[3].text.strip(),
                    'disease': cells[4].text.strip(),
                    'species': cells[5].text.strip(),
                    'location': cells[6].text.strip(),
                    'network': cells[7].text.strip(),
                })
        
        return outbreaks

    except TimeoutException as e:
        print(f"❌ Operation timed out: {e}")
        return []
    except Exception as e:
        print(f"❌ Error fetching ProMED outbreaks: {e}")
        return []
    finally:
        if 'driver' in locals():
            print('\n⏸ Press ENTER to close browser...')
            input() 
            driver.quit()

# --------------------------- RUN ---------------------------
if __name__ == '__main__':
    # Add a safety delay for PyAutoGUI to give you time to move the mouse
    pyautogui.PAUSE = 0.1 
    
    outbreaks = fetch_promed_outbreaks()
    
    if not outbreaks:
        print('✅ No new outbreaks found or an error occurred.')
    else:
        print('\n⚠️ New Outbreaks in India:')
        for outbreak in outbreaks:
            print('-' * 20)
            print(f"  Alert ID: {outbreak['alertId']}")
            print(f"  Date: {outbreak['date']}")
            print(f"  Title: {outbreak['title']}")
            print(f"  Region: {outbreak['region']}")
            print(f"  Disease: {outbreak['disease']}")
            print(f"  Species: {outbreak['species']}")
            print(f"  Location: {outbreak['location']}")
            print(f"  Network: {outbreak['network']}")
            print('')