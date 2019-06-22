precision mediump float;

uniform sampler2D brush_shape;
uniform vec4 brush_color;

varying vec2 surface_texcoord;

void main()
{
    vec4 shape_color = texture2D(brush_shape, surface_texcoord);
    vec4 color = brush_color * shape_color;
    
    gl_FragColor = color;
}