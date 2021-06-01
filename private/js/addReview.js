function submit1() {
  const score = document.getElementById('score').value
  const movie = document.getElementById('title').value
  const reviewer = document.getElementById('username').value
  const summaryReview = document.getElementById('summary').value
  const fullReview = "";

  const requestBody = {
    reviewer,
    movie,
    score,
    summaryReview,
    fullReview,
  }

  //console.log(requestBody)

  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 201) {
      alert('Success!')
      window.location = '/movies'
    } else if (this.readyState === 4 && this.status === 400) {
      // Here would be where you would handle errors from the request
    }
  }
  xhttp.open('POST', '/movies/:Title', true)
  xhttp.setRequestHeader('Content-Type', 'application/json')
  xhttp.send(JSON.stringify(requestBody))
}

function submit2() {
  const score = document.getElementById('score').value
  const summaryReview = document.getElementById('summary').value
  const fullReview = document.getElementById('reviewText').value
  const movie = document.getElementById('title').value
  const reviewer = document.getElementById('username').value

  const requestBody = {
    reviewer,
    movie,
    score,
    summaryReview,
    fullReview,
  }

  //console.log(requestBody)

  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 201) {
      alert('Success!')
      window.location = '/movies'
    } else if (this.readyState === 4 && this.status === 400) {
      // Here would be where you would handle errors from the request
    }
  }
  xhttp.open('POST', '/movies/:Title', true)
  xhttp.setRequestHeader('Content-Type', 'application/json')
  xhttp.send(JSON.stringify(requestBody))
}