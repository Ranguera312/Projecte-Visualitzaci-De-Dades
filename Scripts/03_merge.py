import pandas as pd

results = pd.read_csv(
    "data/raw/motogp.csv"
)

climate = pd.read_csv(
    "data/processed/circuits_climate.csv"
)

master = results.merge(
    climate,
    on="circuit_name",
    how="left"
)

master.to_csv(
    "data/processed/master.csv"
)

print(master.shape)
print(master.head())
