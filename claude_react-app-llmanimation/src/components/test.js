class GeneratedObject {
  constructor(objname, svgcode, templatecode, rule) {
    this.objname = objname
    this.svgcode = svgcode
    this.template = new ObjectTemplate(templatecode, rule)
    this.rule = rule

    // Automatically save the generated object into cachedobjects using codename
    window.cachedobjects[objname] = this;
  }
  
  placeObj(canvas, coord, scale = 1) {
      const content = this.svgcode
      const svgElement = this.createSVGElement(content, coord, canvas.canvasContainer.offsetWidth, canvas.canvasContainer.offsetHeight, scale);
      console.log('svgelement placing', coord, canvas.canvasContainer.offsetWidth, canvas.canvasContainer.offsetHeight, scale, svgElement)
      canvas.canvasContainer.appendChild(svgElement);
  }
                          createSVGElement(svgContent, coord, canvasWidth, canvasHeight, scale) {
const svgWrapper = document.createElement('div');
svgWrapper.innerHTML = svgContent.trim();
const svgElement = svgWrapper.firstElementChild;

// Get the original dimensions of the SVG
const viewBox = svgElement.viewBox.baseVal;
const originalWidth = viewBox.width;
const originalHeight = viewBox.height;

// Calculate the scaled dimensions
const scaledWidth = originalWidth * scale;
const scaledHeight = originalHeight * scale;

// Calculate the percentage-based coordinates
const leftPercent = (coord.x );
const topPercent = (coord.y );

// Position the SVG so that it is centered at the given coordinates
svgElement.style.position = 'absolute';
// svgElement.style.left = \`\${leftPercent}%\`;
// svgElement.style.top = \`\${topPercent}%\`;
svgElement.style.transform = `translate(`+`${leftPercent}%`+`, `+`${topPercent}%`+`) translate(-50%, -50%) scale(${scale})`; // Center the SVG element

return svgElement;
}
}  

//another class
class ObjectTemplate {
  constructor(templatecode, rule) {
    this.templatecode = templatecode
    this.rule = rule
  }
  async createObj(name, parameterContents = []){
      var obj;
      // need to parameterize
      const parameters = this.rule.parameters;
    
      // Replace the placeholders in the SVG string with actual parameter contents
      var svgHTML = this.templatecode
      // const svgString = svgElement.outerHTML;

      parameters.forEach((param, index) => {
          const placeholder = '{' + param + '}';
          svgHTML = svgHTML.replace(new RegExp(placeholder, 'g'), parameterContents[index]);
      });

      //save the new obj to app
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
      //create obj instance
      //console.log('creating obj in template.createobj', this.rule)
      obj = new GeneratedObject(name, svgHTML, this.templatecode, this.rule)
      //console.log('returning obj:', obj)
      return obj; // Return the codename
  }
}  
