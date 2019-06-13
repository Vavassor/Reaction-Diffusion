precision mediump float;

uniform sampler2D velocity_field;
uniform vec2 velocity_field_size;

varying vec2 surface_texcoord;

const float DELTA_TIME = 1.0 / 120.0;
const float DENSITY = 1.0;

void main()
{
    vec2 pixel_size = 1.0 / velocity_field_size;
    float east = texture2D(velocity_field, surface_texcoord + vec2(pixel_size.x, 0.0)).x;
    float west = texture2D(velocity_field, surface_texcoord - vec2(pixel_size.x, 0.0)).x;
    float north = texture2D(velocity_field, surface_texcoord + vec2(0.0, pixel_size.y)).y;
    float south = texture2D(velocity_field, surface_texcoord - vec2(0.0, pixel_size.y)).y;
    float divergence = (-2.0 * pixel_size.x * DENSITY / DELTA_TIME) * ((east - west) + (north - south));
    gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
}