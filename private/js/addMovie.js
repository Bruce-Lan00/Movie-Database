function submit1() {
    const name = document.getElementById('name').value
  
    const requestBody = {
        name
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
    xhttp.open('POST', '/contribut', true)
    xhttp.setRequestHeader('Content-Type', 'application/json')
    xhttp.send(JSON.stringify(requestBody))
  }
  
  function submit2() {
    const Title = document.getElementById('title').value
    const Runtime = document.getElementById('runtime').value
    const Year = document.getElementById('releaseyear').value
    const writer = document.getElementById('writers').value
    const Director = document.getElementById('directors').value
    const Actors = document.getElementById('actors').value
  
    const requestBody = {
        Title,
        Runtime,
        Year,
        writer,
        Director,
        Actors,
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
    xhttp.open('POST', '/contribut', true)
    xhttp.setRequestHeader('Content-Type', 'application/json')
    xhttp.send(JSON.stringify(requestBody))
  }