import sys
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
###### helper functions. Use them when needed #######


# def get_title_from_index(index):
#     return df[df.index == index]["title"].values[0]


# def get_index_from_title(title):
#     return df[df.title == title]["index"].values[0]
##################################################

# Step 1: Read CSV File
df = pd.read_csv("StationaryLog.csv")


# Step 2: Select Features
features = ["title", "category", "description"]


# Step 3: Create a column in DF which combines all selected features


for feature in features:
    df[feature] = df[feature].fillna('')


def combine_features(row):
    try:
        return row['title']+" "+row['category'] + " "+row["description"]
    except Exception as e:
        print("error:", str(e))


df["combined_features"] = df.apply(combine_features, axis=1)


# Step 4: Create count matrix from this new combined column
cv = CountVectorizer()
count_matrix = cv.fit_transform(df["combined_features"])
temp = count_matrix.toarray()


# Step 5: Compute the Cosine Similarity based on the count_matrix

cs_Simi = cosine_similarity(count_matrix)

#movie_user_likes = sys.argv[1]
product_search_id = sys.argv[1]

# Step 6: Get index of this movie from its title
my_movie_index = df[df['_id'] == product_search_id].index[0]


# Step 7: Get a list of similar movies in descending order of similarity score
finalArr = cs_Simi[my_movie_index]

list_tuples = list(enumerate(finalArr))

sorted_list = sorted(list_tuples, key=lambda x: x[1], reverse=True)

result = ""
# Step 8: Print titles of first 50 movies
for li in sorted_list:
    result = result+(df[df.index == li[0]]["_id"].values[0])+"/"


print(result)
