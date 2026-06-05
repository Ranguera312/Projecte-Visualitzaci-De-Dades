import pandas as pd

df = pd.read_csv("Data/Raw/MotoGP.csv")

circuits = (
    df[["circuit_name"]]
    .drop_duplicates()
    .sort_values("circuit_name")
)

circuits.to_csv(
    "data/processed/circuits.csv",
    index=False
)

print(circuits.head())