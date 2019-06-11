precision mediump float;

uniform sampler2D velocity_field;

varying vec2 surface_texcoord;

void main()
{
    vec2 velocity = texture2D(velocity_field, surface_texcoord).xy;
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}