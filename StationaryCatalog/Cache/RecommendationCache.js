class RecommendCache {
  constructor() {
    this.cacheMap = new Map();
    console.log("class initiated");
  }

  getVal(val) {
    if (!this.cacheMap.has(val)) return null;
    else return this.cacheMap.get(val);
  }

  setVal(key, val) {
    this.cacheMap.set(key, val);
  }
}

module.exports = RecommendCache;
