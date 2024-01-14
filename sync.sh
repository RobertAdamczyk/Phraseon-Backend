#/bin/sh

echo "Synchronizing Phrase Localizations"

# Project Credentials and local file setup
ACCESS_TOKEN='uw8y8I4oqYMqjneBwAuEF7u7yZe2'
PROJECT_ID='1UbV8ZlIyBeXTf5nrqwV'

# Check if Network is available 
echo "Checking Network connectivity..."
if ping -q -c 1 -W 1 google.com >/dev/null; then
  echo "Network available; downloading localizations"
else
  echo "Network unavailable; skipping synchronization"
  exit 0
fi

# Get the data from Firebase Function
echo "Getting Data from Firebase Function..."
RESPONSE=$(curl -s -H "x-access-key: ${ACCESS_TOKEN}" "https://us-central1-phrasify-inhouse.cloudfunctions.net//getKeys?projectId=${PROJECT_ID}")

# Check if the response is empty
if [ -z "$RESPONSE" ]; then
  echo "No data received or an error occurred."
  exit 1
fi

# Remove existing translation files
rm ./Localizable_*.strings 2> /dev/null

# Extract and save each language's translations to a separate file
echo "Extracting and saving translations..."
echo "$RESPONSE" | jq -r 'to_entries[] | .key as $key | .value | to_entries[] | "\($key) \(.key) \(.value)"' | while read -r id lang text; do
  # Remove quotes from the beginning and end of the text
  text="${text%\"}"
  text="${text#\"}"

  # Create or update the file for the given language
  echo "\"$id\" = \"$text\";" >> "./Localizable_$lang.strings"
done

echo "Localization files created."
