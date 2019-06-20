precision mediump float;

uniform sampler2D brush_shape;
uniform vec4 brush_color;

varying vec2 surface_texcoord;

void main()
{
    vec4 color = brush_color * texture2D(brush_shape, surface_texcoord);
    if(color.a < 0.5)
    {
        discard;
    }
    gl_FragColor = vec4(color.rgb, 1.0);
}