let SIZE = 0

function getHorizontalsAndVerticals(clues) {
	let horizontals = [], counter1 = 0
	for (let i = SIZE * 4 - 1; i > (SIZE * 3 - 1); i--) {
		horizontals.push([clues[i], clues[i - (SIZE * 3 - 1) + counter1 * 2]])
		counter1++
	}
	let verticals = [], counter2 = 0
	for (let i = 0; i < SIZE; i++) {
		verticals.push([clues[i], clues[i + (SIZE * 3 - 1) - counter2 * 2]])
		counter2++
	}
	return [horizontals, verticals]
}

function getFirstVariants(horOrVertArr) {
	const outputVariants = []
	horOrVertArr.forEach(el => {
		let subArr = []
		for (let i = 0; i < SIZE; i++) {
			const arr = []
			for (let k = 1; k <= SIZE; k++) arr.push(k)
			subArr.push(arr)
		}

		if (el[0] === SIZE) {
			subArr = []
			for (let i = 1; i <= SIZE; i++)subArr.push([i])
		} else if (el[0] === 2) {
			subArr[0] = subArr[0].filter(el => el !== SIZE)
			subArr[1] = subArr[1].filter(el => el !== (SIZE - 1))
		} else if (el[0] === 1) {
			subArr[0] = [SIZE]
			for (let i = 1; i < SIZE; i++) subArr[i].pop()
		} else {
			let cnt = el[0] - 2
			for (let i = 0; i < cnt; i++) subArr[i].splice(i + SIZE + 1 - el[0])
		}

		if (el[1] === SIZE) {
			subArr = []
			for (let i = SIZE; i > 0; i--) subArr.push([i])
		} else if (el[1] === 2) {
			subArr[SIZE - 1].splice(SIZE - 1)
			subArr[SIZE - 2] = subArr[SIZE - 2].filter(el => el !== (SIZE - 1))
		} else if (el[1] === 1) {
			subArr[SIZE - 1] = [SIZE]
			for (let i = 0; i < SIZE - 1; i++) subArr[i] = subArr[i].filter(el => el !== SIZE)
		} else {
			let cnt = SIZE + 1 - el[1]
			for (let i = cnt; i < SIZE; i++)subArr[i].splice(SIZE * 2 - el[1] - i)
		}
		outputVariants.push(subArr)
	})
	return outputVariants
}

// (mutate horVars и verVars)
function deleteByComparison(horVars, verVars) {
	for (let k = 0; k < SIZE; k++) {
		for (let i = 0; i < SIZE; i++) {
			let newArr = []
			if (horVars[k][i].length < verVars[i][k].length) newArr = horVars[k][i].filter(el => verVars[i][k].includes(el))
			else newArr = verVars[i][k].filter(el => horVars[k][i].includes(el))
			horVars[k][i] = verVars[i][k] = newArr
		}
	}
}

// Params: rowStrVar - string like '123456', limits - [5, 0]
function isValidComb(rowStrVar, limits) {
	let counterLR = 0
	let minPointerLR = 0
	for (let i = 0; i < SIZE; i++) {
		if (rowStrVar[i] > minPointerLR) {
			minPointerLR = +rowStrVar[i]
			counterLR++
		}
	}
	let counterRL = 0
	let minPointerRL = 0
	for (let i = SIZE - 1; i >= 0; i--) {
		if (rowStrVar[i] > minPointerRL) {
			minPointerRL = +rowStrVar[i]
			counterRL++
		}
	}
	if ((limits[0] == counterLR || limits[0] == 0) && (limits[1] == counterRL || limits[1] == 0)) return true
	else return false
}

// Params: row like - [[5],[6],[1, 2, 3, 4],[1, 2, 3, 4],[3, 4],[1, 2, 3, 4],],  limits like - [0, 3]
// (mutate row)
function recursiveGetStrCombs(row, limits, indSubArr = 0, strArr = []) {
	if (indSubArr === 0) return recursiveGetStrCombs(row, limits, indSubArr + 1, row[0].map(el => String(el)))

	const newStrArr = []
	for (let i = 0; i < row[indSubArr].length; i++) {
		for (let k = 0; k < strArr.length; k++) {
			if (strArr[k].indexOf(String(row[indSubArr][i])) == -1) {
				newStrArr.push(String(strArr[k]) + String(row[indSubArr][i]))
			}
		}
	}

	if (indSubArr === SIZE - 1) return newStrArr.filter(str => isValidComb(str, limits))

	return recursiveGetStrCombs(row, limits, indSubArr + 1, newStrArr)
}

//Params: row like - [[5],[6],[1, 2, 3, 4],[1, 2, 3, 4],[3, 4],[1, 2, 3, 4],],  limits like - [0, 3]
function trimRow(row, limits) {
	let variants = recursiveGetStrCombs(row, limits)

	const afterFiltPossibleValues = []
	for (let i = 0; i < SIZE; i++)afterFiltPossibleValues.push(new Set())

	variants.forEach(strVar => {
		for (let i = 0; i < SIZE; i++) afterFiltPossibleValues[i].add(+strVar[i])
	})
	for (let i = 0; i < SIZE; i++) row[i] = row[i].filter(el => afterFiltPossibleValues[i].has(el))
	// return variants
	return row
}


function clearByLimitationsWrapper(horVars, verVars, horizontals, verticals) {
	let allVariantsSum = 1, newVariantsSum = 0 // markers to stop the loop
	while (allVariantsSum !== newVariantsSum) {
		allVariantsSum = newVariantsSum
		// remove unnecessary by comparing the vertices in the array of horizontals and verticals (looks at each vertex in the array of horizontals and verticals,
		// leaves at the top only those options that are in both arrays)
		deleteByComparison(horVars, verVars)

		horVars.map((sA, ind) => trimRow(sA, horizontals[ind]))
		verVars.map((sA, ind) => trimRow(sA, verticals[ind]))

		newVariantsSum = horVars.reduce((sum, curr) => sum += curr.reduce((sum2, curr2) => sum2 += curr2.length, 0), 0)
	}
}


// Of the remaining options for each vertex, one by one tries to substitute one - runs 'clearByLimitationsWrapper' for such a scenario,
// if there are empty arrays for vertices at the end - add data from this vertex to 'shouldDelete'
function enumRemainingVariants(horizontals, verticals, horVarsCopy, verVarsCopy, comb) {

	let shouldDelete = []

	let horVarsCopyCopy = []
	for (let i = 0; i < SIZE; i++) horVarsCopyCopy.push(horVarsCopy[i].map(subSubArr => subSubArr.slice()))
	let verVarsCopyCopy = []
	for (let i = 0; i < SIZE; i++) verVarsCopyCopy.push(verVarsCopy[i].map(subSubArr => subSubArr.slice()))

	comb.forEach(combsEl => {
		horVarsCopyCopy[+combsEl[0]][+combsEl[1]].forEach(el2 => {
			horVarsCopyCopy[+combsEl[0]][+combsEl[1]] = [el2]
			clearByLimitationsWrapper(horVarsCopyCopy, verVarsCopyCopy, horizontals, verticals)

			let hasEmptyArrs = false
			for (let a = 0; a < SIZE; a++) {
				for (let b = 0; b < SIZE; b++) {
					if (!horVarsCopyCopy[a][b].length) hasEmptyArrs = true
					break
				}
			}
			if (hasEmptyArrs) shouldDelete.push({ from: combsEl, deleteThis: el2 })

			horVarsCopyCopy = []
			for (let n = 0; n < SIZE; n++) horVarsCopyCopy.push(horVarsCopy[n].map(subSubArr => subSubArr.slice()))
			verVarsCopyCopy = []
			for (let n = 0; n < SIZE; n++) verVarsCopyCopy.push(verVarsCopy[n].map(subSubArr => subSubArr.slice()))
		})
	})
	return shouldDelete
}


function solvePuzzle(clues) {
	SIZE = clues.length / 4

	const [horizontals, verticals] = getHorizontalsAndVerticals(clues)

	let horVars = getFirstVariants(horizontals)
	let verVars = getFirstVariants(verticals)

	clearByLimitationsWrapper(horVars, verVars, horizontals, verticals)


	const horVarsCopy = []
	for (let i = 0; i < SIZE; i++) horVarsCopy.push(horVars[i].map(subSubArr => subSubArr.slice()))
	const verVarsCopy = []
	for (let i = 0; i < SIZE; i++) verVarsCopy.push(verVars[i].map(subSubArr => subSubArr.slice()))

	for (let i = SIZE; i > 1; i--) {
		let stopCheckForThis_i = false
		while (!stopCheckForThis_i) {
			let lngEqualCells = []
			for (let k = 0; k < SIZE; k++) {
				for (let i2 = 0; i2 < SIZE; i2++) {
					const lng = horVars[k][i2].length
					if (lng === i) lngEqualCells.push(`${k}${i2}`)
				}
			}

			let result = enumRemainingVariants(horizontals, verticals, horVarsCopy, verVarsCopy, lngEqualCells)

			result.forEach(resEl => {
				horVars[+resEl.from[0]][+resEl.from[1]] = horVars[+resEl.from[0]][+resEl.from[1]].filter(el => el != +resEl.deleteThis)
				horVarsCopy[+resEl.from[0]][+resEl.from[1]] = horVars[+resEl.from[0]][+resEl.from[1]]
			})
			if (!result.length) stopCheckForThis_i = true
		}
	}

	if (horVars.reduce((sum, curr) => sum += curr.reduce((sum2, curr2) => sum2 += curr2.length, 0), 0) === SIZE ** 2) horVars = horVars.map(subArr => subArr.flat())
	return horVars
}
