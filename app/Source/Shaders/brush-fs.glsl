precision mediump float;

uniform sampler2D brush_shape;
uniform vec4 brush_color;

varying vec2 shape_texcoord;

void main()
{
    gl_FragColor = brush_color * texture2D(brush_shape, shape_texcoord);
}