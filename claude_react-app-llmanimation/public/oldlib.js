const ngrok_url_sonnet = 'https://3ec7-34-69-17-15.ngrok-free.app' + '/api/message'
console.log('executing oldlib')
// Check if the Generate class has already been defined
if (!window.Rule) {
    class Rule {
        constructor(arg1 = '', arg2 = {}) {
            // Check if the subclass has a static 'doc' property
            if (this.constructor.doc) {
                this.basic_prompt = this.constructor.doc;
                this.parameters = this.constructor.qualitative_params || [];
                this.abstract_params = this.constructor.abstract_params || [];
            } else {
                // Existing constructor logic
                if (typeof arg1 === 'string') {
                    this.basic_prompt = arg1;
                    this.useobj = arg2.useobj || {
                        objname: ''
                    };
                } else if (typeof arg1 === 'object') {
                    this.basic_prompt = arg1.prompt || '';
                    this.useobj = arg1.useobj || {
                        objname: ''
                    };
                }
                this.parameters = [];
                this.abstract_params = [];
            }

            // Initialize other properties
            this.ngrok_url_sonnet = ngrok_url_sonnet;
            this.useobj = this.useobj || {
                objname: ''
            };
            this.modifyobj = '';
            this.piecenames = [];
            this.piecenamemodify = [];
            // Initialize drawQueue if it's used elsewhere in your code
            // this.drawQueue = Promise.resolve();

            console.log('Rule created with basic_prompt:', this.basic_prompt);
        }

        async draw(abstractparameterContents = []) {
            console.log('object draw called, check rule', this);

            var APIprompt = '';

            if (this.modifyobj) {
                console.log('modify obj')
                const codename = this.modifyobj
                const codelist = window.currentreuseableSVGElementList
                console.log('check codelist in ref', codelist)
                var existingcode = codelist.find((item) => item.codeName === codename)?.codeText;
                console.log('draw with ref code:', codename, existingcode)
                // Wait for the cachedobjectsRef to be provided by the parent (React app)
                window.parent.postMessage({
                    type: 'GET_AnnotatedPieceList'
                }, '*');
                const annotatedPieceList = await new Promise((resolve) => {
                    const messageHandler = (event) => {
                        if (event.data && event.data.type === 'RETURN_AnnotatedPieceList') {
                            console.log('Received AnnotatedPieceList from parent:', event.data.currentAnnotatedPieceList);
                            // Resolve the promise with the received data
                            resolve(event.data.currentAnnotatedPieceList);
                            // Remove the event listener once the data is received
                            window.removeEventListener('message', messageHandler);
                        }
                    };

                    // Start listening for the RETURN_AnnotatedPieceList event
                    console.log('Waiting for RETURN_AnnotatedPieceList event...');
                    window.addEventListener('message', messageHandler);
                });

                // Use the received annotatedPieceList data
                console.log('AnnotatedPieceList:', annotatedPieceList);
                var annotated_prompt = 'With respect to these svg pieces of specific contents: '
                // Filter the objects that match the given codeName
                annotatedPieceList.forEach(obj => {
                    if (obj.codeName === codename) {
                        // Collect the groupname and corresponding pieces
                        const group = obj.groupname;
                        const pieces = obj.pieces.join(',');

                        // Append to the prompt
                        annotated_prompt += `"${group}" relates to these svg pieces: ${pieces}, `;
                    }
                });
                if (annotated_prompt == 'With respect to these svg pieces of specific contents: ') {
                    annotated_prompt = ''
                }
                console.log('annotated_prompt', annotated_prompt)
                var abstract_param_prompt = ''
                if (this.abstract_params.length > 0) {
                    abstract_param_prompt = ''
                    this.abstract_params.forEach((abstract_param, index) => {
                        const param_content = abstractparameterContents[index];
                        abstract_param_prompt += `for ` + abstract_param + ` , make it ` + param_content + `; `;
                    });
                    console.log('check abstract_param_prompt', abstract_param_prompt)
                }
                console.log('modifyobj-no piece')
                //have params
                if (this.parameters.length > 0) {
                    existingcode = window.cachedobjects[codename].templatecode
                    APIprompt = `you will be given an svg template code generated by this rule: write me svg code to create a svg image of ` + this.basic_prompt + `. Make the svg image as detailed as possible and as close to the description as possible.  
              Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
              For example, parameter list: roof height, window color; resulting svg template:
              <svg viewBox="0 0 200 200">
              <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
              <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
              <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
              <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
              <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
              </svg>.
              
              Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:` + this.parameters.join(', ') + `. Do not include any background in generated svg. 
              The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
              Make sure donot include anything other than the final svg code template in your response.
              This is the svg template code generated by the above rule: ` + existingcode

                        +
                        `Now, you are going to modify the above given svg template to make it satisfy this new description: ` + this.basic_prompt +
                        `, and these these new parameters:` + this.parameters.join(', ') + `. ` + annotated_prompt + abstract_param_prompt + ` As long as the original svg template follows the new requirements, make as little change as possible. Make sure donot include anything other than the svg template code in your response
              `
                }
                //no params
                else {
                    existingcode = window.cachedobjects[codename].templatecode
                    APIprompt = 'write me an updated svg code basing on this existing code: ' + existingcode + ' and description: ' + this.basic_prompt + '. ' + annotated_prompt + abstract_param_prompt + ' If the existing code conforms to the description, return the same code without change; Otherwise, return the code slightly updated according to the existing description. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';

                }
            } else {
                console.log('no existing code', this.parameters, this.abstract_params)
                var abstract_param_prompt = 'Also, '
                if (this.abstract_params.length > 0) {
                    this.abstract_params.forEach((abstract_param, index) => {
                        const param_content = abstractparameterContents[index];
                        abstract_param_prompt += `for ` + abstract_param + ` , make it ` + param_content + `; `;
                    });
                    console.log('check abstract_param_prompt', abstract_param_prompt)
                }

                if (this.parameters.length > 0) {
                    APIprompt = `write me svg code to create a svg image of ` + this.basic_prompt + `. ` + abstract_param_prompt + `Make the svg image as detailed as possible and as close to the description as possible.  
            Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
            For example, parameter list: roof height, window color; resulting svg template:
            <svg viewBox="0 0 200 200">
            <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
            <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
            <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
            <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
            <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
            </svg>.
            
            Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:` + this.parameters.join(', ') + `. Do not include any background in generated svg. 
            The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
            Make sure donot include anything other than the final svg code template in your response.`;
                } else {
                    APIprompt = 'write me svg code to create a svg image of ' + this.basic_prompt + `. ` + abstract_param_prompt + `Make the svg image as detailed as possible and as close to the description as possible. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.`;
                }
            }

            console.log('api prompt', APIprompt);
            console.log(this.ngrok_url_sonnet);

            try {
                const response = await axios.post(this.ngrok_url_sonnet, {
                    prompt: APIprompt
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = response.data;
                const content = data?.content;
                console.log('Content from API call:', content);

                if (content) {
                    // const svgElement = this.createSVGElement(content, coord, canvas.offsetWidth, canvas.offsetHeight, scale);
                    // canvas.appendChild(svgElement);
                    // console.log('svgElement is', svgElement);
                    // return svgElement;
                    return content
                }
            } catch (error) {
                console.error('Error drawing the shape:', error);
            }
        }


        static async generateObj(parameterContents = [], abstractparameterContents = [], context = '', name = '') {
            // Create an instance of the class to initialize instance properties
            const instance = new this(); // This will refer to the class that calls it, like House or Rule

            // If the name is not provided, generate a default name
            if (!name) {
                name = 'newobj' + window.newobjID.toString(); // Default to "newobj" + newobjID
                window.newobjID = window.newobjID + 1; // Increment the newobjID for the next object
            }

            if (typeof context === 'object' && context !== null) {
                console.log('context is an object:', context);
                instance.modifyobj = context.objname || '';
            } else if (typeof context === 'string') {
                console.log('context is a string:', context);
                instance.modifyobj = context; // Handle the case where context is a string
            }

            let obj;

            // Add the draw operation to the queue
            // this.drawQueue = this.drawQueue.then(async () => {
            var svgElement;
            var svgHTML;
            var svgHTMLtemplate;
            // const coord = null;
            console.log('debugnow', instance, parameterContents, parameterContents.length)
            if (parameterContents.length > 0) {
                // need to parameterize
                const parameters = instance.parameters;

                // Replace the placeholders in the SVG string with actual parameter contents
                svgHTML = await instance.draw(abstractparameterContents);
                // const svgString = svgElement.outerHTML;

                svgHTMLtemplate = svgHTML

                parameters.forEach((param, index) => {
                    const placeholder = '{' + param + '}';
                    svgHTML = svgHTML.replace(new RegExp(placeholder, 'g'), parameterContents[index]);
                });

                console.log('have param', svgHTML)

            } else {
                //no parameter needed
                svgHTML = await instance.draw(abstractparameterContents);
                console.log('no param', svgHTML)
            }

            if (svgHTML) {
                //const svgHTML = svgElement.outerHTML;
                const codename = name;
                // Send the message to update the reusable element list
                window.parent.postMessage({
                    type: 'UPDATE_REUSEABLE',
                    codename: codename,
                    codetext: svgHTML
                }, '*');
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

                obj = new GeneratedObject(codename, svgHTML, svgHTMLtemplate, instance.modifyobj,
                    instance.piecenames,
                    instance.piecenamemodify,
                    instance.parameters,
                    instance.abstract_params,
                    parameterContents,
                    abstractparameterContents,
                    instance.basic_prompt)
                console.log('returning obj:', obj)
                return obj; // Return the codename
            }
            // }).catch(error => {
            //   console.error('Error in canvas draw sequence:', error);
            // });

            // return this.drawQueue.then(() => obj); // Ensure the codename is returned

        }


        updateHTMLString(canvas, svgElement, codename, coord, scale, ifcode2desc) {
            console.log('in updatedhtmlstring', ifcode2desc)
            // Convert the SVG element to its outer HTML
            svgElement.setAttribute('name', codename); // Add this line to set the name attribute
            const svgHTML = svgElement.outerHTML;
            //console.log('svgHtml:', svgElement, svgHTML);

            // Construct the div containing the SVG element with positioning
            const positionedSvgHTML = `<div>` +
                svgHTML +
                `</div>`;

            // Update backendhtmlString by appending the new positioned SVG's HTML
            canvas.backendhtmlString = canvas.backendhtmlString.replace('</body>', positionedSvgHTML + '</body>');

            // Post the updated HTML back to the parent component
            window.parent.postMessage({
                type: 'UPDATE_HTML',
                html: canvas.backendhtmlString
            }, '*');

            //console.log("updateHTMLString with positioned SVG:", positionedSvgHTML);

            if (ifcode2desc) {
                // Add the svgHTML to the reusable element list with codename
                console.log('need code2desc')
                window.parent.postMessage({
                    type: 'CODE2DESC',
                    code: canvas.backendhtmlString
                }, '*');
            }

        }

        //end of class 
    }

    // Assign the class to the global window object
    window.Rule = Rule;
}

//another class
if (!window.GeneratedObject) {
    class GeneratedObject {
        constructor(objname, svgcode, templatecode, modifyobj,
            piecenames,
            piecenamemodify,
            parameters,
            abstract_params,
            parametercontents,
            abstractparametercontents,
            basic_prompt) {
            this.objname = objname
            this.svgcode = svgcode
            // this.template = new ObjectTemplate(templatecode, rule)
            this.templatecode = templatecode
            //this.rule = rule
            this.modifyobj = modifyobj;
            this.piecenames = piecenames;
            this.piecenamemodify = piecenamemodify;
            this.parameters = parameters,
                this.abstract_params = abstract_params;
            this.parametercontents = parametercontents,
                this.abstractparametercontents = abstractparametercontents,
                this.basic_prompt = basic_prompt,
                this.annotated_pieces = {}
            // Automatically save the generated object into cachedobjects using codename
            window.cachedobjects[objname] = this;
        }

        async modify(parameterContents = [], abstractparameterContents = [], name = '') {
            var svgHTML;
            if (!name) {
                name = 'newobj' + window.newobjID.toString(); // Default to "newobj" + newobjID
                window.newobjID = window.newobjID + 1; // Increment the newobjID for the next object
            }
            if (parameterContents.length > 0) {
                // If the name is not provided, generate a default name

                var obj;
                // need to parameterize
                const parameters = this.parameters;

                // Replace the placeholders in the SVG string with actual parameter contents
                svgHTML = this.templatecode
                // const svgString = svgElement.outerHTML;

                parameters.forEach((param, index) => {
                    const placeholder = '{' + param + '}';
                    svgHTML = svgHTML.replace(new RegExp(placeholder, 'g'), parameterContents[index]);
                });
            } else {
                svgHTML = this.svgcode
            }

            //if there is abstract params, we need to use API to update it
            if (abstractparameterContents.length > 0) {
                window.parent.postMessage({
                    type: 'GET_AnnotatedPieceList'
                }, '*');
                const annotatedPieceList = await new Promise((resolve) => {
                    const messageHandler = (event) => {
                        if (event.data && event.data.type === 'RETURN_AnnotatedPieceList') {
                            console.log('Received AnnotatedPieceList from parent:', event.data.currentAnnotatedPieceList);
                            // Resolve the promise with the received data
                            resolve(event.data.currentAnnotatedPieceList);
                            // Remove the event listener once the data is received
                            window.removeEventListener('message', messageHandler);
                        }
                    };

                    // Start listening for the RETURN_AnnotatedPieceList event
                    console.log('Waiting for RETURN_AnnotatedPieceList event...');
                    window.addEventListener('message', messageHandler);
                });

                // Use the received annotatedPieceList data
                console.log('AnnotatedPieceList:', annotatedPieceList);
                var annotated_prompt = 'With respect to these svg pieces of specific contents: '
                // Filter the objects that match the given codeName
                annotatedPieceList.forEach(obj => {
                    if (obj.codeName === this.objname) {
                        // Collect the groupname and corresponding pieces
                        const group = obj.groupname;
                        const pieces = obj.pieces.join(',');

                        // Append to the prompt
                        annotated_prompt += `"${group}" relates to these svg pieces: ${pieces}, `;
                    }
                });
                if (annotated_prompt == 'With respect to these svg pieces of specific contents: ') {
                    annotated_prompt = ''
                }
                console.log('annotated_prompt', annotated_prompt)
                var abstract_param_prompt = ''
                if (this.abstract_params.length > 0) {
                    abstract_param_prompt = ''
                    this.abstract_params.forEach((abstract_param, index) => {
                        const param_content = abstractparameterContents[index];
                        abstract_param_prompt += `for ` + abstract_param + ` , make it ` + param_content + `; `;
                    });
                    console.log('check abstract_param_prompt', abstract_param_prompt)
                }
                var existingcode = svgHTML
                var APIprompt = 'Slightly update this svg code: ' + existingcode + ' with the following instructions: ' + annotated_prompt + abstract_param_prompt + ' If the existing code conforms to the description, return the same code without change; Otherwise, return the code slightly updated according to the existing description. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';
                console.log('modify APIprompt', APIprompt)
                var url = ngrok_url_sonnet
                try {
                    const response = await axios.post(url, {
                        prompt: APIprompt
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = response.data;
                    const content = data?.content;
                    console.log('Content from API call:', content);

                    if (content) {
                        //save the new obj to app
                        const codename = name;
                        // Send the message to update the reusable element list
                        window.parent.postMessage({
                            type: 'UPDATE_REUSEABLE',
                            codename: codename,
                            codetext: content
                        }, '*');
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
                        obj = new GeneratedObject(name, content, this.templatecode, this.modifyobj,
                            this.piecenames,
                            this.piecenamemodify,
                            this.parameters,
                            this.abstract_params,
                            parameterContents,
                            abstractparameterContents,
                            this.basic_prompt)
                        console.log('returning obj:', obj)
                        return obj; // Return the codename

                    }
                } catch (error) {
                    console.error('Error drawing the shape:', error);
                }
            } else {
                var annotated_prompt = ''
                var abstract_prompt = ''
                //save the new obj to app
                const codename = name;
                // Send the message to update the reusable element list
                window.parent.postMessage({
                    type: 'UPDATE_REUSEABLE',
                    codename: codename,
                    codetext: svgHTML
                }, '*');
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
                obj = new GeneratedObject(name, svgHTML, this.templatecode, this.modifyobj,
                    this.piecenames,
                    this.piecenamemodify,
                    this.parameters,
                    this.abstract_params,
                    parameterContents,
                    abstractparameterContents,
                    this.basic_prompt)
                //console.log('returning obj:', obj)
                return obj; // Return the codename
            }


        }

        placeObj(canvas, coord = {
            x: 50,
            y: 50
        }, scale = 1, tl = null, tr = null, bl = null, br = null) {
            const content = this.svgcode;

            // Create a DOMParser to parse the SVG content
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(content, 'image/svg+xml');

            // Extract and remove any <script> tag inside the SVG
            const scriptElements = svgDoc.getElementsByTagName('script');
            let scriptContent = '';
            if (scriptElements.length > 0) {
                scriptContent = scriptElements[0].textContent; // Extract script content
                scriptElements[0].parentNode.removeChild(scriptElements[0]); // Remove the script from the SVG
            }

            // Serialize the updated SVG without <script> and add to the canvas
            const serializer = new XMLSerializer();
            const svgElementStr = serializer.serializeToString(svgDoc.documentElement);
            console.log('debugnow', content, svgElementStr)
            // Create an element from the parsed SVG
            const svgElement = this.createSVGElement(
                svgElementStr,
                coord,
                canvas.canvasContainer.offsetWidth,
                canvas.canvasContainer.offsetHeight,
                scale,
                tl,
                tr,
                bl,
                br
            );

            console.log(
                'svgelement placing',
                coord,
                canvas.canvasContainer.offsetWidth,
                canvas.canvasContainer.offsetHeight,
                scale,
                svgElement
            );

            // Append the SVG element to the canvas container
            canvas.canvasContainer.appendChild(svgElement);

            // Execute the script content manually, if any
            if (scriptContent) {
                try {
                    eval(scriptContent); // Use eval to execute the extracted script
                } catch (e) {
                    console.error('Error executing SVG script:', e);
                }
            }
        }


        createSVGElement(
            svgContent,
            coord = {
                x: 50,
                y: 50
            },
            canvasWidth,
            canvasHeight,
            scale = 1,
            tl = null,
            tr = null,
            bl = null,
            br = null
        ) {
            const svgWrapper = document.createElement('div');
            svgWrapper.innerHTML = svgContent.trim();
            const svgElement = svgWrapper.firstElementChild;

            // Get the original dimensions of the SVG
            const viewBox = svgElement.viewBox.baseVal;
            const originalWidth = viewBox.width;
            const originalHeight = viewBox.height;

            // Functions to convert percentage to pixels
            const percentToPixelX = (percent) => (canvasWidth * percent) / 100;
            const percentToPixelY = (percent) => (canvasHeight * percent) / 100;

            // Collect specified corners
            const srcPts = [];
            const dstPts = [];

            // Map corners to source and destination points
            if (tl) {
                srcPts.push([0, 0]); // top-left corner of SVG
                dstPts.push([percentToPixelX(tl.x), percentToPixelY(tl.y)]);
            }
            if (tr) {
                srcPts.push([originalWidth, 0]); // top-right corner of SVG
                dstPts.push([percentToPixelX(tr.x), percentToPixelY(tr.y)]);
            }
            if (bl) {
                srcPts.push([0, originalHeight]); // bottom-left corner of SVG
                dstPts.push([percentToPixelX(bl.x), percentToPixelY(bl.y)]);
            }
            if (br) {
                srcPts.push([originalWidth, originalHeight]); // bottom-right corner of SVG
                dstPts.push([percentToPixelX(br.x), percentToPixelY(br.y)]);
            }

            if (srcPts.length > 0) {
                // Attempt to satisfy scale along with the specified corners
                let matrix;
                let scaleApplied = true;

                if (srcPts.length === 1) {
                    // One corner specified
                    // Apply scale and position the SVG at the specified corner
                    const [dstX, dstY] = dstPts[0];
                    const scaledWidth = originalWidth * scale;
                    const scaledHeight = originalHeight * scale;

                    // Adjust position based on the specified corner
                    let translateX = dstX;
                    let translateY = dstY;

                    if (tl) {
                        // No adjustment needed
                    } else if (tr) {
                        translateX -= scaledWidth;
                    } else if (bl) {
                        translateY -= scaledHeight;
                    } else if (br) {
                        translateX -= scaledWidth;
                        translateY -= scaledHeight;
                    }

                    svgElement.style.position = 'absolute';
                    svgElement.style.left = `${translateX}px`;
                    svgElement.style.top = `${translateY}px`;
                    svgElement.style.width = `${scaledWidth}px`;
                    svgElement.style.height = `${scaledHeight}px`;
                    svgElement.style.transform = ''; // No additional transform needed
                } else if (srcPts.length >= 2) {
                    // Two or more corners specified
                    // Calculate the transformation matrix including scale

                    // First, compute the scaling factors implied by the specified corners
                    // and compare them with the provided scale

                    // Compute distances in source and destination
                    const srcDistances = [];
                    const dstDistances = [];

                    for (let i = 0; i < srcPts.length - 1; i++) {
                        for (let j = i + 1; j < srcPts.length; j++) {
                            const srcDx = srcPts[j][0] - srcPts[i][0];
                            const srcDy = srcPts[j][1] - srcPts[i][1];
                            const srcDistance = Math.hypot(srcDx, srcDy);
                            srcDistances.push(srcDistance);

                            const dstDx = dstPts[j][0] - dstPts[i][0];
                            const dstDy = dstPts[j][1] - dstPts[i][1];
                            const dstDistance = Math.hypot(dstDx, dstDy);
                            dstDistances.push(dstDistance);
                        }
                    }

                    // Compute average scaling factor from specified corners
                    let impliedScale = 0;
                    let scaleCount = 0;
                    for (let i = 0; i < srcDistances.length; i++) {
                        if (srcDistances[i] !== 0) {
                            impliedScale += dstDistances[i] / srcDistances[i];
                            scaleCount++;
                        }
                    }
                    if (scaleCount > 0) {
                        impliedScale /= scaleCount;
                    } else {
                        impliedScale = scale;
                    }

                    // Compare implied scale with provided scale
                    if (Math.abs(impliedScale - scale) > 0.01) {
                        // Scale is in conflict, discard provided scale
                        scaleApplied = false;
                        scale = impliedScale;
                    }

                    // Recalculate destination points considering the scale
                    const scaledSrcPts = srcPts.map(([x, y]) => [x * scale, y * scale]);

                    if (srcPts.length === 2) {
                        // Compute similarity transformation
                        matrix = this.calculateSimilarityTransform(scaledSrcPts, dstPts);
                    } else if (srcPts.length === 3) {
                        // Compute affine transformation
                        matrix = this.calculateAffineTransform(scaledSrcPts, dstPts);
                    } else if (srcPts.length === 4) {
                        // Compute projective transformation
                        matrix = this.calculateProjectiveTransform(scaledSrcPts, dstPts);
                    }

                    svgElement.style.position = 'absolute';
                    svgElement.style.left = '0px';
                    svgElement.style.top = '0px';
                    svgElement.style.transformOrigin = '0 0';
                    svgElement.style.transform = `matrix3d(${matrix.join(',')})`;
                    svgElement.style.width = `${originalWidth * scale}px`;
                    svgElement.style.height = `${originalHeight * scale}px`;
                }
            } else {
                // No corners specified, use coord and scale
                const scaledWidth = originalWidth * scale;
                const scaledHeight = originalHeight * scale;

                let leftPixel, topPixel, transform;

                if (coord) {
                    leftPixel = percentToPixelX(coord.x);
                    topPixel = percentToPixelY(coord.y);
                    transform = 'translate(-50%, -50%)';
                } else {
                    leftPixel = canvasWidth / 2;
                    topPixel = canvasHeight / 2;
                    transform = 'translate(-50%, -50%)';
                }

                svgElement.style.position = 'absolute';
                svgElement.style.left = `${leftPixel}px`;
                svgElement.style.top = `${topPixel}px`;
                svgElement.style.width = `${scaledWidth}px`;
                svgElement.style.height = `${scaledHeight}px`;
                svgElement.style.transform = transform;
            }

            return svgElement;
        }

        // Helper functions remain the same but with slight modifications

        // Helper function to calculate the projective transformation matrix
        calculateProjectiveTransform(srcPts, dstPts) {
            // Calculates a 4x4 matrix for a projective transformation from srcPts to dstPts
            // srcPts and dstPts are arrays of [x, y] coordinates

            // Set up the linear system: Ah = b
            const A = [];
            const b = [];

            for (let i = 0; i < 4; i++) {
                const [x, y] = srcPts[i];
                const [X, Y] = dstPts[i];

                A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
                A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
                b.push(X);
                b.push(Y);
            }

            // Solve for h using least squares (A * h ≈ b)
            const h = this.solveLinearSystem(A, b);

            // Construct the 3x3 homography matrix
            const H = [
                h[0], h[1], h[2],
                h[3], h[4], h[5],
                h[6], h[7], 1
            ];

            // Convert the 3x3 homography matrix to a 4x4 matrix3d for CSS
            const matrix3d = [
                H[0], H[3], 0, H[6],
                H[1], H[4], 0, H[7],
                0, 0, 1, 0,
                H[2], H[5], 0, 1
            ];

            return matrix3d;
        }
        // Helper function to solve a linear system (A * x = b)
        solveLinearSystem(A, b) {
            // Use the Gaussian elimination method to solve the system
            const matrixSize = A.length;
            const augmentedMatrix = A.map((row, i) => [...row, b[i]]);

            // Forward elimination
            for (let i = 0; i < matrixSize; i++) {
                // Find the pivot row
                let maxRow = i;
                for (let k = i + 1; k < matrixSize; k++) {
                    if (Math.abs(augmentedMatrix[k][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
                        maxRow = k;
                    }
                }

                // Swap the pivot row with the current row
                [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]];

                // Eliminate entries below the pivot
                for (let k = i + 1; k < matrixSize; k++) {
                    const factor = augmentedMatrix[k][i] / augmentedMatrix[i][i];
                    for (let j = i; j <= matrixSize; j++) {
                        augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
                    }
                }
            }

            // Back substitution
            const x = new Array(matrixSize).fill(0);
            for (let i = matrixSize - 1; i >= 0; i--) {
                let sum = augmentedMatrix[i][matrixSize];
                for (let j = i + 1; j < matrixSize; j++) {
                    sum -= augmentedMatrix[i][j] * x[j];
                }
                x[i] = sum / augmentedMatrix[i][i];
            }

            return x;
        }
        calculateSimilarityTransform(srcPts, dstPts, scale) {
            // srcPts and dstPts are arrays of 2D points: [[x1, y1], [x2, y2]]

            const [x0, y0] = srcPts[0];
            const [x1, y1] = srcPts[1];
            const [X0, Y0] = dstPts[0];
            const [X1, Y1] = dstPts[1];

            // Source vector
            const dx1 = x1 - x0;
            const dy1 = y1 - y0;
            const srcLength = Math.hypot(dx1, dy1);

            // Destination vector
            const dx2 = X1 - X0;
            const dy2 = Y1 - Y0;
            const dstLength = Math.hypot(dx2, dy2);

            if (srcLength === 0 || dstLength === 0) {
                console.error('Cannot compute similarity transform with zero-length vectors.');
                return null;
            }

            // Compute scaling factor
            const impliedScale = dstLength / srcLength;

            // Compare implied scale with provided scale
            const usedScale = Math.abs(impliedScale - scale) < 0.01 ? scale : impliedScale;

            // Recalculate source points considering the used scale
            const scaledX0 = x0 * usedScale;
            const scaledY0 = y0 * usedScale;
            const scaledX1 = x1 * usedScale;
            const scaledY1 = y1 * usedScale;

            // Compute rotation angle
            const angle1 = Math.atan2(dy1, dx1);
            const angle2 = Math.atan2(dy2, dx2);
            const angle = angle2 - angle1;

            // Compute rotation matrix components
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            // Compute translation
            const tx = X0 - (scaledX0 * cosA - scaledY0 * sinA);
            const ty = Y0 - (scaledX0 * sinA + scaledY0 * cosA);

            // Construct the transformation matrix
            const matrix = [
                cosA * usedScale, sinA * usedScale, 0, 0,
                -sinA * usedScale, cosA * usedScale, 0, 0,
                0, 0, 1, 0,
                tx, ty, 0, 1
            ];

            return matrix;
        }


    }
    window.GeneratedObject = GeneratedObject;
}
//another class                    

// Another class
if (!window.whole_canvas) {
    class whole_canvas {
        constructor(canvas_color) {
            this.canvasContainer = create_canvas(canvas_color);

            this.reuseablecodelist = [];;

            // Initialize backendhtmlString with the canvas container
            this.backendhtmlString = `
                                  <!DOCTYPE html>
                                  <html lang="en">
                                  <head>
                                      <meta charset="UTF-8">
                                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                      <title>Canvas and SVG</title>
                                      <style>
                                          html, body {
                                              margin: 0;
                                              padding: 0;
                                              width: 100%;
                                              height: 100%;
                                              display: flex;
                                              justify-content: center;
                                              align-items: center;
                                              overflow: hidden;
                                          }
                                          #canvasContainer {
                                              position: relative;
                                              width: 100%;
                                              height: 100%;
                                              background-color: ${canvas_color};
                                          }
                                      </style>
                                  </head>
                                  <body>
                                      <div id="canvasContainer"></div>
                                  </body>
                                  </html>`;
            console.log('Canvas created and backendhtmlString initialized');

            // Initialize the queue as a resolved Promise to maintain order
            this.drawQueue = Promise.resolve();
        }
    }
    window.whole_canvas = whole_canvas;
}

// Check if classcode.js needs to be executed
// Message listener to execute code
window.addEventListener('message', function(event) {
    console.log('listening to execute calls??')
    if (event.data.type === 'EXECUTE_CLASSCODE') {
        // Execute classcode.js
        console.log('Executing classcode.js', event.data.classcode);
        try {
            (0, eval)(event.data.classcode.js); // Executes in global scope
        } catch (e) {
            console.error('Error executing classcode.js:', e);
        }
    }
})
window.addEventListener('message', function(event) {
    if (event.data.type === 'EXECUTE_USERCODE') {

        console.log('running user.js')
        window.parent.postMessage({
            type: 'LOAD_CACHEDOBJECT'
        }, '*');

        function recoverClassFromClassInfo(data) {
            if (data === null || typeof data !== 'object') return data;

            // Handle arrays that were mistakenly serialized as objects with numbered keys
            if (isSerializedArray(data)) {
                return Object.values(data);
            }

            // Handle arrays recursively
            if (Array.isArray(data)) {
                return data.map(item => recoverClassFromClassInfo(item));
            }

            if (data.classinfo) {
                // Log to see the recovery of classinfo
                console.log('Recovering', data.classinfo);

                // Check the classinfo property and restore the corresponding class
                let recoveredInstance;
                switch (data.classinfo) {
                    case 'Rule': {
                        recoveredInstance = new Rule();
                        Object.assign(recoveredInstance, data);
                        break;
                    }
                    case 'GeneratedObject': {
                        const {
                            objname = '', svgcode = '', templatecode = '', modifyobj = '', piecenames = '', piecenamemodify = '', parameters = '', abstract_params, parametercontents = '', abstractparametercontents = '', basic_prompt = '', annotated_pieces = ''
                        } = data;
                        const templatecodeInstance = recoverClassFromClassInfo(templatecode); // Recover the template properly
                        const piecenamesInstance = recoverClassFromClassInfo(piecenames); // Recover the rule as well
                        const piecenamemodifyInstance = recoverClassFromClassInfo(piecenamemodify); // Recover the rule as well
                        const parametersInstance = recoverClassFromClassInfo(parameters); // Recover the rule as well
                        const abstractparametercontentsInstance = recoverClassFromClassInfo(abstractparametercontents); // Recover the rule as well
                        const abstract_paramsInstance = recoverClassFromClassInfo(abstract_params); // Recover the rule as well
                        const parametercontentsInstance = recoverClassFromClassInfo(parametercontents); // Recover the rule as well

                        const basic_promptInstance = recoverClassFromClassInfo(basic_prompt); // Recover the rule as well
                        const annotated_piecesInstance = recoverClassFromClassInfo(annotated_pieces);
                        recoveredInstance = new GeneratedObject(objname, svgcode, templatecodeInstance, piecenamesInstance, piecenamemodifyInstance, parametersInstance, abstract_paramsInstance, parametercontentsInstance, abstractparametercontentsInstance, basic_promptInstance, annotated_piecesInstance);
                        Object.assign(recoveredInstance, data); // Assign any additional properties
                        break;
                    }

                    case 'whole_canvas': {
                        const canvas = new whole_canvas(data.canvas_color || '#FFFFFF');
                        Object.assign(canvas, data);
                        recoveredInstance = canvas;
                        break;
                    }
                    default:
                        recoveredInstance = data; // If no matching class, return the data as-is
                        break;
                }

                // Remove the classinfo field after the object is recovered
                delete recoveredInstance.classinfo;

                // Recursively recover subobjects
                for (const key in recoveredInstance) {
                    if (recoveredInstance.hasOwnProperty(key) && typeof recoveredInstance[key] === 'object') {
                        recoveredInstance[key] = recoverClassFromClassInfo(recoveredInstance[key]);
                    }
                }

                return recoveredInstance;
            }

            // If no classinfo is found, continue recursively recovering properties
            for (const key in data) {
                if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
                    data[key] = recoverClassFromClassInfo(data[key]);
                }
            }

            return data;
        }

        // Helper function to check if an object was serialized as an array
        function isSerializedArray(obj) {
            if (typeof obj !== 'object' || obj === null) return false;

            // Check if all keys are sequential numbers starting from 0
            const keys = Object.keys(obj);
            return keys.every((key, index) => Number(key) === index);
        }




        // No timeout, keep waiting for CACHEDOBJECT_LOADED indefinitely before executing user.js
        (async function() {
            console.log('Waiting for CACHEDOBJECT_LOADED event...');

            window.cachedobjects = {}; // Declare as a reference to be assigned

            // Wait for the cachedobjectsRef to be provided by the parent (React app)
            await new Promise((resolve) => {
                const messageHandler = (event) => {
                    if (event.data.type === 'SYNC_PREVIOUS_OBJECTS_REF') {
                        console.log('Received cachedobjectsRef from parent:', event.data.cachedobjects);
                        if (event.data.cachedobjects) {
                            window.cachedobjects = recoverClassFromClassInfo(event.data.cachedobjects); // Directly assign the deserialized reference
                        }
                        resolve();
                    }
                };

                // Keep listening for the CACHEDOBJECT_LOADED event
                window.addEventListener('message', messageHandler);
            });

            // // Post cachedobjects to parent for saving to cachedobjectslog
            // window.parent.postMessage({ type: 'LOG_CACHEDOBJECTS', content: window.cachedobjects }, '*');


            //   // Execute user.js only after CACHEDOBJECT_LOADED is received
            // console.log('Executing user.js');
            try {
                // (0, eval)(event.data.usercode);
                const asyncUserFunction = new Function(`
                                          return (async () => {
                                            ${event.data.usercode}
                                          })();
                                        `);

                await asyncUserFunction();
            } catch (e) {
                console.error('Error executing usercode.js:', e);
            }

            // console.log('sending cachedobjects to window', window.cachedobjects.dog1.constructor.name)

            // Replace promises with the string 'promise' before saving
            //const cleanedCachedObjects = replacePromisesInObject(window.cachedobjects);

            //console.log('sending cachedobjects to window 2', cleanedCachedObjects.dog1.constructor.name)

            // Add a classinfo property to each object for serialization
            function addClassInfo(obj) {
                if (obj === null || typeof obj !== 'object') return obj;

                // Clone the object and add the classinfo property
                const objectWithClassInfo = {
                    ...obj,
                    classinfo: obj.constructor.name
                };

                // Recursively process object properties
                for (const key in objectWithClassInfo) {
                    if (objectWithClassInfo.hasOwnProperty(key) && typeof objectWithClassInfo[key] === 'object') {
                        objectWithClassInfo[key] = addClassInfo(objectWithClassInfo[key]);
                    }
                }

                return objectWithClassInfo;
            }


            // Serialize cachedobjects with class info before sending to the parent
            const cachedObjectsWithClassInfo = addClassInfo(window.cachedobjects);

            console.log('check cachedObjectsWithClassInfo', cachedObjectsWithClassInfo)

            // Send serialized cached objects back to the parent window
            window.parent.postMessage({
                type: 'SAVE_CACHEDOBJECTS',
                content: cachedObjectsWithClassInfo
            }, '*');
        })();
    }
})