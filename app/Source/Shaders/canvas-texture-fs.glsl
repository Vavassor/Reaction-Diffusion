precision mediump float;

uniform sampler2D image;
uniform vec2 image_dimensions;

void main()
{
    gl_FragColor = texture2D(image, gl_FragCoord.xy / image_dimensions);
}