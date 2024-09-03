async generateandDrawObj(name, canvas, coord, scale = 1, ifcode2desc = false) {
  console.log('generateandDrawObj called', ifcode2desc);

  // Add the draw operation to the queue
  this.drawQueue = this.drawQueue.then(async () => {
    const svgElement = await this.draw(coord, canvas.canvasContainer, canvas.reuseablecodelist, scale);
    if (svgElement) {
      console.log('SVG content added to canvasContainer');
      this.updateHTMLString(canvas, svgElement, this.basic_prompt, coord, scale, ifcode2desc); // Pass the codename and code
      const svgHTML = svgElement.outerHTML;
      const codename = name;
    // Send the message to update the reusable element list
    window.parent.postMessage({ type: 'UPDATE_REUSEABLE', codename: codename, codetext: svgHTML }, '*');
    console.log('Sent UPDATE_REUSEABLE message with codename:', codename);

    // Wait for the confirmation after sending the message
    await new Promise((resolve) => {
        const messageHandler = (event) => {
            if (event.data.type === 'UPDATE_REUSEABLE_CONFIRMED' && event.data.codename === codename) {
                window.currentreuseableSVGElementList = event.data.reuseableSVGElementList;
                console.log('Received UPDATE_REUSEABLE_CONFIRMED for codename:', window.currentreuseableSVGElementList);
                window.removeEventListener('message', messageHandler);
                resolve(); // Resolve the promise to continue execution
            }
        };
        window.addEventListener('message', messageHandler);
    });
      // Function to highlight or unhighlight the clicked SVG element
      // Array to keep track of all highlighted elements
      window.highlightedElements = [];
      window.original
      // Function to toggle highlight on an SVG element by modifying its attributes
      function toggleHighlight(event) {
      console.log('clicked on svg', event.currentTarget);
      event.stopPropagation();

      const target = event.currentTarget;

      // Check if the element is already highlighted
      const svgtext = target.outerHTML
      const isHighlighted = target.getAttribute('data-highlighted') === 'true';

      if (isHighlighted) {
      // If already highlighted, reset to original attributes and remove from the list
      const originalStroke = target.getAttribute('data-original-stroke') || 'none';
      const originalStrokeWidth = target.getAttribute('data-original-stroke-width') || '1';

      // Set the stroke and stroke-width back to their original values
      target.setAttribute('stroke', originalStroke);
      target.setAttribute('stroke-width', originalStrokeWidth);

      target.removeAttribute('data-highlighted');
      target.removeAttribute('data-original-stroke-width'); // Remove the custom stroke-width
      target.removeAttribute('data-original-stroke'); // Remove the custom stroke-width
      window.highlightedElements = window.highlightedElements.filter(el => el !== target);

      // If the stroke is 'none' and stroke-width is '0', remove these attributes
      if (originalStroke === 'none' && parseFloat(originalStrokeWidth) === 0) {
      target.removeAttribute('stroke');
      target.removeAttribute('stroke-width');
      }
      // Also remove from the highlightedSVGPieceList
      const codename = target.outerHTML.split(' ')[0];
      // Also remove from the highlightedSVGPieceList
      const svgString = target.outerHTML

      // Send a message to the parent to remove the SVG piece
      window.parent.postMessage({ type: 'REMOVE_SVGPIECE', codetext: svgString }, '*');
      } else {
      // If not highlighted, store original attributes, apply highlight, and add to the list
      const originalStroke = target.getAttribute('stroke') || 'none';
      const originalStrokeWidth = target.getAttribute('stroke-width') || '0';

      target.setAttribute('data-original-stroke', originalStroke);
      target.setAttribute('data-original-stroke-width', originalStrokeWidth);
      target.setAttribute('stroke', 'yellow');
      target.setAttribute('stroke-width', parseFloat(originalStrokeWidth) + 10);
      target.setAttribute('data-highlighted', 'true');
      window.highlightedElements.push(target);
      console.log('heighlighted')
      // Add the SVG piece to the highlightedSVGPieceList
      const codename = target.outerHTML.split(' ')[0];
      const svgString = svgtext
      console.log('posting')
      // Send the updated SVG piece to the parent
      window.parent.postMessage({ type: 'UPDATE_SVGPIECE', codename: codename, codetext: svgString }, '*');
      }

      // Trigger the re-render
      reRenderCanvas();
      }

      // Function to re-render the canvas without rerunning user.js
      function reRenderCanvas() {
      console.log('Re-rendering canvas');

      const canvasContainer = document.getElementById('canvasContainer');

      if (canvasContainer) {
      const svgElements = Array.from(canvasContainer.querySelectorAll('svg'));

      // Clear the canvas
      while (canvasContainer.firstChild) {
      canvasContainer.removeChild(canvasContainer.firstChild);
      }

      // Re-append the saved SVG elements
      svgElements.forEach(svg => {
      canvasContainer.appendChild(svg);
      });
      }
      }

      // Function to remove highlights from all elements in the highlightedElements array
      function removeAllHighlights() {
      window.highlightedElements.forEach(element => {
      element.setAttribute('stroke', element.getAttribute('data-original-stroke') || 'none');
      element.setAttribute('stroke-width', element.getAttribute('data-original-stroke-width') || '1');
      element.removeAttribute('data-highlighted');
      });

      // Clear the list after removing highlights
      window.highlightedElements = [];

      // Trigger the re-render
      reRenderCanvas();
      }

      function attachHighlightListeners(svgElement) {
      // Remove any existing listeners to prevent duplication
      svgElement.removeEventListener('click', toggleHighlight);
      console.log('toggleHighlight added')
      // Attach the new click event listener
      svgElement.addEventListener('click', toggleHighlight);
      console.log('toggleHighlight deleted')
      }

      //attach click listener to the svg that is generated in this draw call call
      svgElement.querySelectorAll('*').forEach(svgChildElement => {
      svgChildElement.addEventListener('click', toggleHighlight);
      });
      console.log('added listener for ', svgElement.outerHTML)

      // If the user clicks outside of an SVG element, remove highlights from all highlighted elements
      document.body.addEventListener('click', function(event) {
      if (!event.target.closest('svg *')) {
      removeAllHighlights();
      window.parent.postMessage({ type: 'EMPTY_SVGPIECE'}, '*');
      }
      });
      
      const obj = {objname: codename, rule: this}
      console.log('returning obj:', obj.objname, obj.rule)
      return obj; // Return the codename
    }
  }).catch(error => {
    console.error('Error in canvas draw sequence:', error);
  });
  
  return this.drawQueue.then(() => obj); // Ensure the codename is returned
}

updateHTMLString(canvas, svgElement, codename, coord, scale, ifcode2desc) {
  console.log('in updatedhtmlstring', ifcode2desc)
  // Convert the SVG element to its outer HTML
  svgElement.setAttribute('name', codename); // Add this line to set the name attribute
  const svgHTML = svgElement.outerHTML;
  //console.log('svgHtml:', svgElement, svgHTML);

  // Construct the div containing the SVG element with positioning
  const positionedSvgHTML = `<div>`
      +svgHTML+
  `</div>`;

  // Update backendhtmlString by appending the new positioned SVG's HTML
  canvas.backendhtmlString = canvas.backendhtmlString.replace('</body>', positionedSvgHTML + '</body>');

  // Post the updated HTML back to the parent component
  window.parent.postMessage({ type: 'UPDATE_HTML', html: canvas.backendhtmlString }, '*');

  //console.log("updateHTMLString with positioned SVG:", positionedSvgHTML);

  if(ifcode2desc){
    // Add the svgHTML to the reusable element list with codename
    console.log('need code2desc')
    window.parent.postMessage({ type: 'CODE2DESC', code: canvas.backendhtmlString}, '*');
  }

}