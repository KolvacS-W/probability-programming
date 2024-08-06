import React, { useEffect, useRef } from 'react';

interface ResultViewerProps {
  code: {
    html: string;
    css: string;
    js: string;
  };
}

const ResultViewer: React.FC<ResultViewerProps> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument;

      if (iframeDocument) {
        // Clear existing content
        iframeDocument.open();
        iframeDocument.write('<!DOCTYPE html><html lang="en"><head></head><body></body></html>');
        iframeDocument.close();

        // Create the new content
        const newDocument = iframeDocument;
        if (newDocument) {
          newDocument.open();
          newDocument.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Fabric.js Library Example</title>
                <style>${code.css}</style>
            </head>
            <body>
                <canvas id="c"></canvas>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/1.4.0/fabric.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
                <script>
                  // Ensure the Generate class is not redefined
                  if (!window.Generate) {
                    class Generate {
                      constructor(name) {
                        this.basic_prompt = name;
                        this.detail_prompt = '';
                        console.log('object created:', name);
                      }

                      detail(detail) {
                        this.detail_prompt = detail;
                        console.log('detail added:', detail);
                      }

                      async draw(coord, canvas, ngrok_url) {
                        const APIprompt = 'write me svg code to create a ' + this.basic_prompt + ', with these details: ' + this.detail_prompt + '. Make sure donot include anything other than the svg code in your response.';
                        console.log('api prompt', APIprompt);
                        try {
                          const response = await axios.post(ngrok_url, {
                            prompt: APIprompt
                          }, {
                            headers: {
                              'Content-Type': 'application/x-www-form-urlencoded'
                            }
                          });

                          const data = response.data;
                          const content = data?.content;
                          console.log('content from api call:', content);

                          if (content) {
                            fabric.loadSVGFromString(content, (objects, options) => {
                              const group = fabric.util.groupSVGElements(objects, options);
                              group.set({
                                left: coord.x - group.width / 2,
                                top: coord.y - group.height / 2
                              });
                              canvas.add(group);
                              canvas.renderAll();
                            });
                          }
                        } catch (error) {
                          console.error('Error drawing the shape:', error);
                        }
                      }
                    }
                    window.Generate = Generate;
                  }
                </script>
                <script>
                  (function() {
                    ${code.js}
                  })();
                </script>
            </body>
            </html>
          `);
          newDocument.close();
        }
      }
    }
  }, [code]);

  return (
    <div className="result-viewer">
      <iframe key={JSON.stringify(code)} ref={iframeRef} title="Result Viewer" />
    </div>
  );
};

export default ResultViewer;
