"""
Stage 1: Data ingestion and preprocessing for the World Cup Squad Builder project.

Owner:
    Person A

Purpose:
    - Load raw FIFA player data from the Kaggle "EA Sports FC 24 complete player dataset"
      (specifically the `male_players.csv` file).
    - Filter to the latest FIFA version (fifa_version == 24) to avoid duplicates across versions.
    - Clean and normalize the data, including position mapping into high-level buckets
      (GK, DEF, MID, FWD).
    - Cache the cleaned data to a reproducible CSV in `data/processed/players_cleaned.csv`.
    - Convert cleaned rows into LangChain `Document` objects for downstream retrieval.
"""

import os
from typing import List

import pandas as pd
from langchain_core.documents import Document


# Position mapping: raw comma-separated positions -> primary_position
POSITION_TO_CATEGORY = {
    "GK": "GK",
    "CB": "DEF", "LB": "DEF", "RB": "DEF", "LWB": "DEF", "RWB": "DEF",
    "CM": "MID", "CDM": "MID", "CAM": "MID", "LM": "MID", "RM": "MID", "LCM": "MID", "RCM": "MID",
    "ST": "FWD", "LW": "FWD", "RW": "FWD", "CF": "FWD", "LF": "FWD", "RF": "FWD",
}

REQUIRED_COLUMNS = [
    "overall", "player_positions", "wage_eur",
]

OUTFIELD_STAT_COLUMNS = ["pace", "shooting", "passing", "dribbling", "defending", "physic"]

GK_STAT_COLUMNS = [
    "gk_diving", "gk_handling", "gk_kicking", "gk_reflexes", "gk_speed", "gk_positioning",
]

SELECT_COLUMNS = [
    "short_name", "long_name", "player_positions", "primary_position",
    "overall", "potential", "pace", "shooting", "passing", "dribbling", "defending", "physic",
    "gk_diving", "gk_handling", "gk_kicking", "gk_reflexes", "gk_speed", "gk_positioning",
    "value_eur", "wage_eur", "age", "nationality_name", "club_name",
    "skill_moves", "weak_foot", "skill_fk_accuracy",
    "movement_sprint_speed", "movement_acceleration",
    "preferred_foot", "work_rate", "international_reputation",
    "height_cm", "weight_kg",
]


def load_raw_data(filepath: str = "data/raw/male_players.csv") -> pd.DataFrame:
    """Load the raw FIFA player CSV and filter to fifa_version == 24."""
    if not os.path.isfile(filepath):
        raise FileNotFoundError(
            f"Raw data not found at {filepath}. "
            "Download 'EA Sports FC 24 complete player dataset' from Kaggle and place male_players.csv in data/raw/."
        )
    df = pd.read_csv(filepath)
    if "fifa_version" in df.columns:
        df = df[df["fifa_version"] == 24].copy()
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and normalize the raw FIFA player DataFrame."""
    # Drop rows with nulls in universally required columns
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            continue
        df = df.dropna(subset=[col])

    # Normalize player_positions to primary_position (first position in list)
    def map_primary_position(positions_str):
        if pd.isna(positions_str) or not str(positions_str).strip():
            return None
        first_pos = str(positions_str).split(",")[0].strip().upper()
        return POSITION_TO_CATEGORY.get(first_pos)

    df["primary_position"] = df["player_positions"].apply(map_primary_position)
    df = df.dropna(subset=["primary_position"])

    # Separate GKs and outfield players for stat handling
    is_gk = df["primary_position"] == "GK"

    # Drop outfield players missing outfield stats
    outfield = df[~is_gk].copy()
    for col in OUTFIELD_STAT_COLUMNS:
        if col in outfield.columns:
            outfield = outfield.dropna(subset=[col])

    # For GKs: fill missing outfield stats with GK equivalents or 0
    gk = df[is_gk].copy()
    gk_fill_map = {
        "pace": "gk_speed",
        "shooting": "gk_kicking",
        "passing": "gk_kicking",
        "dribbling": "gk_handling",
        "defending": "gk_positioning",
        "physic": "gk_reflexes",
    }
    for outfield_col, gk_col in gk_fill_map.items():
        if outfield_col in gk.columns and gk_col in gk.columns:
            gk[outfield_col] = gk[outfield_col].fillna(gk[gk_col])
        if outfield_col in gk.columns:
            gk[outfield_col] = gk[outfield_col].fillna(0)

    df = pd.concat([outfield, gk], ignore_index=True)

    # Select only columns we need (that exist)
    available = [c for c in SELECT_COLUMNS if c in df.columns]
    df = df[available].copy()
    return df


def cache_processed_data(df: pd.DataFrame, filepath: str = "data/processed/players_cleaned.csv") -> None:
    """Save cleaned DataFrame to CSV; create directory if needed."""
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    df.to_csv(filepath, index=False)


def dataframe_to_documents(df: pd.DataFrame) -> List[Document]:
    """Convert each row to a LangChain Document with natural-language page_content and metadata."""
    docs = []
    for _, row in df.iterrows():
        name = row.get("short_name", row.get("long_name", "Unknown"))
        age = row.get("age", "")
        pos = row.get("primary_position", "")
        nation = row.get("nationality_name", "")
        overall = row.get("overall", "")
        pace = row.get("pace", "")
        shooting = row.get("shooting", "")
        passing = row.get("passing", "")
        dribbling = row.get("dribbling", "")
        defending = row.get("defending", "")
        physic = row.get("physic", "")
        wage = row.get("wage_eur", "")
        club = row.get("club_name", "")
        skills = row.get("skill_moves", "")
        weak = row.get("weak_foot", "")
        sprint = row.get("movement_sprint_speed", "")
        page_content = (
            f"{name} is a {age}-year-old {pos} from {nation}. "
            f"Overall: {overall}, Pace: {pace}, Shooting: {shooting}, Passing: {passing}, "
            f"Dribbling: {dribbling}, Defending: {defending}, Physical: {physic}. "
            f"Wage: {wage} EUR. Club: {club}. "
            f"Skills: {skills} star skill moves, {weak} star weak foot. Sprint Speed: {sprint}."
        )
        metadata = {k: (int(v) if isinstance(v, (float,)) and k not in ("value_eur", "wage_eur") and pd.notna(v) else v) for k, v in row.items()}
        # Ensure numeric types where appropriate
        for key in ["overall", "potential", "pace", "shooting", "passing", "dribbling", "defending", "physic", "age", "skill_moves", "weak_foot", "height_cm", "weight_kg", "international_reputation"]:
            if key in metadata and metadata[key] is not None and pd.notna(metadata[key]):
                try:
                    metadata[key] = int(float(metadata[key]))
                except (ValueError, TypeError):
                    pass
        for key in ["value_eur", "wage_eur", "skill_fk_accuracy", "movement_sprint_speed", "movement_acceleration"]:
            if key in metadata and metadata[key] is not None and pd.notna(metadata[key]):
                try:
                    metadata[key] = float(metadata[key])
                except (ValueError, TypeError):
                    pass
        docs.append(Document(page_content=page_content, metadata=metadata))
    return docs


def load_and_clean_data() -> List[Document]:
    """Orchestrate: load_raw_data -> clean_data -> cache_processed_data -> dataframe_to_documents."""
    df = load_raw_data()
    df = clean_data(df)
    cache_processed_data(df)
    return dataframe_to_documents(df)
