precision mediump float;

uniform vec2 field_size;
uniform sampler2D pressure_field;
uniform sampler2D velocity_field;

varying vec2 surface_texcoord;

const float DELTA_TIME = 1.0 / 120.0;
const float DENSITY = 1.0;

void main()
{
    vec2 pixel_size = 1.0 / field_size;
    
    float west = texture2D(pressure_field, surface_texcoord - vec2(pixel_size.x, 0.0)).x;
    float east = texture2D(pressure_field, surface_texcoord + vec2(pixel_size.x, 0.0)).x;
    float south = texture2D(pressure_field, surface_texcoord - vec2(0.0, pixel_size.y)).x;
    float north = texture2D(pressure_field, surface_texcoord + vec2(0.0, pixel_size.y)).x;

    vec2 delta = vec2(east - west, north - south);
    vec2 velocity = texture2D(velocity_field, surface_texcoord).xy;
    vec2 result = velocity - DELTA_TIME / (2.0 * DENSITY * pixel_size.x) * delta;

    gl_FragColor = vec4(result, 0.0, 1.0);
}