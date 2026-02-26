# Data Documentation: EA Sports FC 24 Player Dataset

## Dataset Overview

- **Dataset name:** EA Sports FC 24 complete player dataset  
- **Author:** Stefano Leone  
- **Source (Kaggle):** `https://www.kaggle.com/datasets/stefanoleone992/ea-sports-fc-24-complete-player-dataset`  
- **Primary file used in this project:** `male_players.csv`  

This dataset contains detailed player statistics extracted from the EA Sports FC 24 video game, including ratings, positions, physical attributes, and club/national team information.

## Download and Placement Instructions

1. Visit the Kaggle dataset page linked above.
2. Download the dataset archive (requires a Kaggle account).
3. Extract the contents of the archive.
4. Place the `male_players.csv` file in the following directory within this repository:

   ```text
   data/raw/male_players.csv
   ```

5. Do **not** commit the raw dataset to the repository; it is ignored via `.gitignore`.

## Filtering and Versioning

- The original dataset includes multiple FIFA game versions.  
- During ingestion, we **filter to `fifa_version == 24`** to:
  - Ensure we only use the most recent version of each player.
  - Avoid duplicates across older FIFA installments.

This filtering is performed in the `src.ingestion.load_raw_data` function.

## Columns Used in This Project

While the raw file contains 100+ columns, the pipeline primarily uses the following subset:

- Identification and naming:
  - `player_id`
  - `short_name`
  - `long_name`
- Positional information:
  - `player_positions` (raw comma-separated positions, e.g., `"ST, LW"`)
  - `primary_position` (derived during ingestion as one of: **GK**, **DEF**, **MID**, **FWD**)
- Overall and core stats:
  - `overall`
  - `potential`
  - `pace`
  - `shooting`
  - `passing`
  - `dribbling`
  - `defending`
  - `physic`
- Financial and age:
  - `value_eur`
  - `wage_eur`
  - `age`
- Contextual info:
  - `nationality_name`
  - `club_name`
  - `league_name` (may be used for analysis or filtering if needed)
- Skill-related fields:
  - `skill_moves`
  - `weak_foot`
  - `skill_fk_accuracy`
  - `movement_sprint_speed`
  - `movement_acceleration`
- Additional metadata:
  - `preferred_foot`
  - `work_rate`
  - `international_reputation`
  - `height_cm`
  - `weight_kg`
  - `fifa_version`
  - `fifa_update`

The ingestion stage drops rows with missing values in key performance and positional columns (e.g., `overall`, `pace`, `shooting`, `passing`, `dribbling`, `defending`, `physic`, `player_positions`, `wage_eur`).

## Caching and Processed Data

After cleaning and normalizing the dataset, the pipeline writes a processed CSV to:

```text
data/processed/players_cleaned.csv
```

This cached file contains:

- Only rows where `fifa_version == 24`.
- A standardized `primary_position` column mapped to **GK**, **DEF**, **MID**, or **FWD**.
- The selected subset of columns listed above.

The caching step improves reproducibility and performance by avoiding repeated cleaning of the raw dataset.

## License and Usage Notes

- The dataset license is specified on the Kaggle page.  
- This project uses the data **for educational purposes only** as part of the IE5374 Generative AI course at Northeastern University.
- The resulting models and squad suggestions:
  - Are based on **video game ratings**, not real-world performance data.
  - Should **not** be used for professional scouting, betting, or other high-stakes decisions.

