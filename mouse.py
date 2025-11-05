import pyautogui
import time

# Move to first coordinate and click

pyautogui.moveTo(354, 1050, duration=0.5)  # moves smoothly in 0.5 seconds
pyautogui.click()
print("✅ Clicked at (281, 723)")

# Wait 2 seconds
time.sleep(2)

# Move to second coordinate and click
pyautogui.moveTo(28, 334, duration=0.5)
pyautogui.click()
print("✅ Clicked at (22, 515)")
