precision mediump float;

uniform sampler2D input_texture;
uniform sampler2D velocity_field;

varying vec2 surface_texcoord;

const float DELTA_TIME = 1.0 / 120.0;

void main()
{
    vec2 velocity = texture2D(velocity_field, surface_texcoord).xy;
    vec2 prior_texcoord = surface_texcoord - (0.5 * DELTA_TIME * velocity);
    gl_FragColor = texture2D(input_texture, prior_texcoord);
}