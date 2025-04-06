from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import os

app = Flask(__name__, static_folder='.', static_url_path='') # Serve static files from current dir

# --- Configuration ---
CSV_FILE_PATH = 'orter_full.csv' # Use your full CSV file name
# Adjust column names if they are different in the full file
NAME_COL = 'name'
LAT_COL = 'latitude'
LON_COL = 'longitude'

# --- Load data ONCE at startup ---
print(f"Loading data from {CSV_FILE_PATH}...")
try:
    # Read only necessary columns, specify dtype for efficiency
    df = pd.read_csv(
        CSV_FILE_PATH,
        usecols=[NAME_COL, LAT_COL, LON_COL],
        dtype={NAME_COL: str, LAT_COL: float, LON_COL: float},
        # Handle the extra commas if they exist in the full file too
        # If the structure is exactly 'name,lat,lon,,', pandas handles it okay.
        # If columns are shifted, you might need 'names=['name','lat','lon','c4','c5']'
        # and then keep only the first three. Test with your full file.
        on_bad_lines='warn' # or 'skip'
    )
    # Drop rows with missing essential data AFTER reading
    df.dropna(subset=[NAME_COL, LAT_COL, LON_COL], inplace=True)
    # Convert name column to lowercase for faster filtering later
    df[NAME_COL] = df[NAME_COL].str.lower()
    print(f"Loaded {len(df)} valid place entries.")
except FileNotFoundError:
    print(f"ERROR: CSV file not found at {CSV_FILE_PATH}")
    df = pd.DataFrame() # Create empty dataframe to avoid errors later
except Exception as e:
    print(f"Error loading CSV: {e}")
    df = pd.DataFrame()

# --- API Endpoint ---
@app.route('/api/places')
def get_places():
    ending = request.args.get('ending', '').lower().strip()

    if not ending:
        return jsonify([]) # Return empty list if no ending provided

    if df.empty:
         return jsonify({"error": "Data not loaded"}), 500

    # Filter the DataFrame
    # .str.endswith() is efficient on string columns
    filtered_df = df[df[NAME_COL].str.endswith(ending, na=False)]

    # Extract coordinates as a list of [lat, lon]
    coords = filtered_df[[LAT_COL, LON_COL]].values.tolist()

    print(f"Found {len(coords)} places ending with '{ending}'")
    return jsonify(coords)

# --- Route to serve the main HTML page ---
@app.route('/')
def index():
    # Serves index.html from the static folder (current directory)
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    # Use host='0.0.0.0' to make it accessible on your network
    app.run(debug=True, host='0.0.0.0', port=5000)