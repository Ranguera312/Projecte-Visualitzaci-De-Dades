import pandas as pd

df = pd.read_csv("Data/Raw/MotoGP.csv")

print("\nSHAPE")
print(df.shape)

print("\nCOLUMNS")
print(df.columns)

print("\nNULLS")
print(df.isnull().sum())

print("\nYEARS")
print(df["year"].min(), df["year"].max())

print("\nRIDERS")
print(df["rider_name"].nunique())

print("\nCIRCUITS")
print(df["circuit_name"].nunique())

print("\nMANUFACTURERS")
print(df["bike_name"].nunique())