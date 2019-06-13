precision mediump float;

uniform sampler2D field;

varying vec2 surface_texcoord;

void main()
{
    vec2 sample = texture2D(field, surface_texcoord).xy;
    vec2 value = (0.5 * sample) + 0.5;
    gl_FragColor = vec4(value, 0.0, 1.0);
}