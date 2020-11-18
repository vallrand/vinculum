export function insertionSort<T>(list: T[], compare: (a: T, b: T) => number){
    for(let length = list.length, i = 1; i < length; i++){
        let j, value: T = list[i]
        for(j = i - 1; j >= 0; j--){
            if(compare(list[j], value) <= 0) break
            list[j+1] = list[j]
        }
        list[j+1] = value
    }
    return list
}

export function sortedIndex<T, V>(list: T[], value: V, compare: (a: T, b: V) => number): number {
    let low = 0, high = list.length
    while(low < high){
        let mid = (low + high) >>> 1
        if(compare(list[mid], value) < 0) low = mid + 1
        else high = mid
    }
    return low
}

export function sortedLastIndex<T>(list: T[], value: T, compare: (a: T, b: T) => number): number {
    let low = 0, high = list.length
    while(low < high){
        let mid = (low + high) >>> 1
        if(compare(list[mid], value) <= 0) low = mid + 1
        else high = mid
    }
    return high
}