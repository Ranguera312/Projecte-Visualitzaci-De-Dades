import pandas as pd

df = pd.read_csv("Data/Processed/master.csv")

#########Com ha evolucionat la MotoGP?##########

timeline = (
    df.groupby(["year", "category"])
      .size()
      .reset_index(name="races")
)

timeline.to_json(
    "Json/timeline.json",
    orient="records"
)

########Top rider################

top_riders = (
    df.groupby(["year","category","rider_name"])
      ["points"]
      .sum()
      .reset_index()  
      .reset_index()
)

top_riders.to_json(
    "Json/top_riders.json",
    orient="records"
)

#########Consistència de pilots##############
consistency = (
    df.groupby(["year","category","rider_name"])
      .agg({
          "position":["mean","std"],
          "points":"sum"
      })
)
consistency.columns = [
    "avg_position",
    "std_position",
    "total_points"
]
consistency["consistency_score"] = (
    1 -
    consistency["std_position"]
    /
    consistency["std_position"].max()
)
consistency.reset_index().to_json(
    "Json/consistency.json",
    orient="records"
)

############Millor fabricant per any###############
manufacturers = (
    df.groupby(
        ["year","category","bike_name"]
    )["points"]
    .sum()
    .reset_index()
)
manufacturers.to_json(
    "Json/manufacturers.json",
    orient="records"
)

###############Weather Resum#############

weather = (
    df.groupby(["year","category","climate_zone"])
      .agg({
          "speed":"mean",
          "points":"mean"
      })
      .reset_index()
)
weather.to_json(
    "Json/ClimateZone.json",
    orient="records"
)

############Climate experts################
climate_perf = (
    df
    .groupby(
        [
            "year",
            "climate_zone",
            "rider_name",
            "category"
        ]
    )
    .agg(
        points=("points", "sum"),
        races=("points", "count")
    )
    .reset_index()
)

climate_perf["climate_index"] = (
    climate_perf["points"]
    / climate_perf["races"]
)

climate_perf.to_json(
    "Json/climate_specialists.json",
    orient="records"
)
